// Recuperación de contraseña: solicitud de enlace y restablecimiento.
import bcrypt from 'bcrypt';
import { CODIGOS_ERROR, MENSAJES } from '@finanzas/shared';
import { AppError } from '../utils/errores.js';
import { sumarMinutos } from '../utils/reloj.js';
import { generarTokenOpaco, hashToken } from '../utils/tokens.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { tokenRecuperacionRepository } from '../repositories/token-recuperacion.repository.js';
import { correoContrasenaActualizada, correoRecuperacion } from '../views/correo.view.js';

/** No se emite otro enlace si ya hay uno vigente creado hace menos de este tiempo (evita inundar de correos). */
const ENFRIAMIENTO_MS = 60_000;

const enlaceInvalido = () =>
  new AppError(MENSAJES.auth.enlaceExpirado, { estado: 400, codigo: CODIGOS_ERROR.TOKEN_INVALID });

export function crearRecuperacionService({ config, reloj, correo, logger, sesiones, costoBcrypt = 12 }) {
  const pendientes = new Set();

  // El envío no se espera: así el tiempo de respuesta no delata si la cuenta existe.
  const enviarSinEsperar = (mensaje) => {
    const envio = correo
      .enviar(mensaje)
      .catch((error) => logger.error({ err: error }, 'no se pudo enviar un correo de recuperación'))
      .finally(() => pendientes.delete(envio));
    pendientes.add(envio);
  };

  return {
    /** Siempre termina igual, exista o no la cuenta. */
    async solicitar({ email }) {
      const usuario = await usuarioRepository.buscarPorEmail(email);
      if (!usuario?.activo) return;

      const ahora = reloj.ahora();
      const reciente = await tokenRecuperacionRepository.buscarVigenteReciente(usuario._id, {
        desde: new Date(ahora.getTime() - ENFRIAMIENTO_MS),
        ahora,
      });
      if (reciente) return;

      await tokenRecuperacionRepository.invalidarPendientes(usuario._id, ahora);
      const token = generarTokenOpaco();
      await tokenRecuperacionRepository.crear({
        usuarioId: usuario._id,
        tokenHash: hashToken(token),
        creadoEn: ahora,
        expiraEn: sumarMinutos(ahora, config.resetTokenTtlMin),
      });
      enviarSinEsperar({
        para: usuario.email,
        ...correoRecuperacion({
          nombre: usuario.nombre,
          enlace: `${config.clientUrl}/restablecer-contrasena?token=${token}`,
          minutos: config.resetTokenTtlMin,
          idioma: usuario.idioma,
        }),
      });
    },

    /** Token vencido, usado o desconocido responden igual: no se revela cuál fue el caso. */
    async restablecer({ token, password }) {
      const ahora = reloj.ahora();
      const registro = await tokenRecuperacionRepository.buscarPorHash(hashToken(token));
      if (!registro || registro.usadoEn || registro.expiraEn <= ahora) throw enlaceInvalido();

      const usuario = await usuarioRepository.buscarPorId(registro.usuarioId);
      if (!usuario?.activo) throw enlaceInvalido();
      // Marca el token como usado antes de cambiar nada: dos solicitudes simultáneas no pueden ganar ambas.
      if (!(await tokenRecuperacionRepository.marcarUsado(registro._id, ahora))) throw enlaceInvalido();

      await usuarioRepository.actualizarPassword(usuario._id, await bcrypt.hash(password, costoBcrypt));
      await tokenRecuperacionRepository.invalidarPendientes(usuario._id, ahora);
      await sesiones.revocarTodas(usuario._id);

      try {
        await correo.enviar({
          para: usuario.email,
          ...correoContrasenaActualizada({ nombre: usuario.nombre, idioma: usuario.idioma }),
        });
      } catch (error) {
        logger.error({ err: error }, 'no se pudo enviar el aviso de contraseña actualizada');
      }
    },

    /** Espera los envíos en curso (cierre ordenado del servidor y pruebas). */
    esperarEnvios: () => Promise.allSettled([...pendientes]),
  };
}
