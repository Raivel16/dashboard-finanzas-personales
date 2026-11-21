// Sesiones: creación, autenticación de cada solicitud, renovación con rotación y cierre.
// La inactividad se mide aquí (en la sesión), no en el token de acceso: ver el diseño, decisión 2.
import { CODIGOS_ERROR, MENSAJES } from '@finanzas/shared';
import { UnauthorizedError } from '../utils/errores.js';
import { sumarDias, sumarMinutos } from '../utils/reloj.js';
import { firmarTokenAcceso, generarTokenOpaco, hashToken, verificarTokenAcceso } from '../utils/tokens.js';
import { sesionRepository } from '../repositories/sesion.repository.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';

/** Una nueva marca de actividad se escribe como máximo una vez por minuto. */
const ACTIVIDAD_MIN_MS = 60_000;
/** Ventana en que el token ya rotado se acepta (dos pestañas que renuevan a la vez). */
const GRACIA_MS = 10_000;

const sesionCerrada = () =>
  new UnauthorizedError(MENSAJES.generales.sesionCerrada, CODIGOS_ERROR.SESSION_REVOKED);
const sesionExpirada = () =>
  new UnauthorizedError(MENSAJES.generales.sesionExpirada, CODIGOS_ERROR.SESSION_EXPIRED);

export function crearSesionService({ config, reloj }) {
  const { inactividadMin, absolutaDias } = config.sesion;

  const vencida = (sesion, ahora) => ahora >= sesion.expiraInactividad || ahora >= sesion.expiraAbsoluta;
  const emitirAcceso = (usuario, sesionId, ahora) =>
    firmarTokenAcceso(
      { usuarioId: usuario._id, tenantId: usuario.tenantId, rol: usuario.rol, sesionId },
      config.jwt,
      ahora,
    );

  async function graciaOReutilizacion(sesion, usuario, ahora) {
    if (sesion.rotadoEn && ahora - sesion.rotadoEn <= GRACIA_MS) {
      return {
        acceso: emitirAcceso(usuario, sesion._id, ahora),
        renovacion: null,
        expiraAbsoluta: sesion.expiraAbsoluta,
        usuario,
      };
    }
    await sesionRepository.revocar(sesion._id, ahora);
    throw sesionCerrada();
  }

  return {
    /** Crea la sesión de un dispositivo y devuelve el par de tokens. */
    async iniciar(usuario) {
      const ahora = reloj.ahora();
      const renovacion = generarTokenOpaco();
      const expiraAbsoluta = sumarDias(ahora, absolutaDias);
      const sesion = await sesionRepository.crear({
        usuarioId: usuario._id,
        tokenHash: hashToken(renovacion),
        ultimaActividad: ahora,
        expiraInactividad: sumarMinutos(ahora, inactividadMin),
        expiraAbsoluta,
      });
      return { acceso: emitirAcceso(usuario, sesion._id, ahora), renovacion, expiraAbsoluta };
    },

    /**
     * Valida el token de acceso y la sesión a la que pertenece. Lee el usuario en cada solicitud para
     * usar su rol vigente, y extiende la inactividad con la actividad real.
     */
    async autenticar(tokenAcceso) {
      const ahora = reloj.ahora();
      const datos = verificarTokenAcceso(tokenAcceso, config.jwt, ahora);
      const [usuario, sesion] = await Promise.all([
        usuarioRepository.buscarPorId(datos.usuarioId),
        sesionRepository.buscarPorId(datos.sesionId),
      ]);
      if (!sesion || !usuario || String(sesion.usuarioId) !== String(usuario._id)) {
        throw new UnauthorizedError(MENSAJES.generales.noAutorizado);
      }
      if (sesion.revocadaEn || !usuario.activo) throw sesionCerrada();
      if (vencida(sesion, ahora)) throw sesionExpirada();

      if (ahora - sesion.ultimaActividad >= ACTIVIDAD_MIN_MS) {
        await sesionRepository.extenderActividad(sesion._id, {
          ahora,
          expiraInactividad: sumarMinutos(ahora, inactividadMin),
        });
      }
      return { usuario, sesion };
    },

    /**
     * Renueva el token de acceso con el token de renovación y lo rota. Un token ya rotado se acepta durante
     * una ventana breve (solo emite acceso); después se interpreta como reutilización y revoca la sesión.
     * @returns {{ acceso: string, renovacion: string | null, expiraAbsoluta: Date, usuario: object }}
     */
    async renovar(tokenRenovacion) {
      if (!tokenRenovacion) throw new UnauthorizedError(MENSAJES.generales.noAutorizado);
      const ahora = reloj.ahora();
      const hash = hashToken(tokenRenovacion);
      const sesion = await sesionRepository.buscarPorTokenHash(hash);
      if (!sesion) throw new UnauthorizedError(MENSAJES.generales.noAutorizado);
      if (sesion.revocadaEn) throw sesionCerrada();
      if (vencida(sesion, ahora)) throw sesionExpirada();

      const usuario = await usuarioRepository.buscarPorId(sesion.usuarioId);
      if (!usuario?.activo) throw sesionCerrada();

      const esAnterior = sesion.tokenHash !== hash;
      if (esAnterior) return graciaOReutilizacion(sesion, usuario, ahora);

      const renovacion = generarTokenOpaco();
      const rotada = await sesionRepository.rotar(sesion._id, {
        tokenHashActual: hash,
        tokenHashNuevo: hashToken(renovacion),
        ahora,
        expiraInactividad: sumarMinutos(ahora, inactividadMin),
      });
      // Otra solicitud rotó primero: este caso es el mismo de la ventana de gracia.
      if (!rotada) {
        const actual = await sesionRepository.buscarPorId(sesion._id);
        if (!actual || actual.revocadaEn) throw sesionCerrada();
        return graciaOReutilizacion({ ...actual, tokenHash: 'otro' }, usuario, ahora);
      }
      return {
        acceso: emitirAcceso(usuario, sesion._id, ahora),
        renovacion,
        expiraAbsoluta: sesion.expiraAbsoluta,
        usuario,
      };
    },

    /**
     * Cierra solo la sesión del dispositivo actual. Nunca falla: con la sesión ya vencida o sin cookies
     * el resultado es el mismo (la persona queda sin sesión).
     */
    async cerrar({ tokenRenovacion, tokenAcceso }) {
      const ahora = reloj.ahora();
      let sesionId = null;
      if (tokenRenovacion) {
        sesionId = (await sesionRepository.buscarPorTokenHash(hashToken(tokenRenovacion)))?._id ?? null;
      }
      if (!sesionId && tokenAcceso) {
        try {
          sesionId = verificarTokenAcceso(tokenAcceso, config.jwt, ahora).sesionId;
        } catch {
          // Token vencido o inválido: no hay nada más que cerrar.
        }
      }
      if (sesionId) await sesionRepository.revocar(sesionId, ahora);
    },

    revocarOtras: (usuarioId, sesionId) => sesionRepository.revocarOtras(usuarioId, sesionId, reloj.ahora()),
    revocarTodas: (usuarioId) => sesionRepository.revocarTodasDeUsuario(usuarioId, reloj.ahora()),
  };
}
