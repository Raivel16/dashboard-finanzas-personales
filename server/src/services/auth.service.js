// Registro e inicio de sesión. La recuperación de contraseña vive en recuperacion.service.js.
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { MENSAJES, ROLES } from '@finanzas/shared';
import { ConflictError, TooManyRequestsError, UnauthorizedError } from '../utils/errores.js';
import { sumarMinutos } from '../utils/reloj.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { correoBienvenida } from '../views/correo.view.js';

export const MAX_INTENTOS = 3;
export const BLOQUEO_MIN = 5;

export function crearAuthService({ config, reloj, correo, logger, sesiones, costoBcrypt = 12 }) {
  // Se compara contra un hash falso cuando el correo no existe, para que el tiempo no delate la cuenta.
  const hashFalso = bcrypt.hashSync('contraseña-que-nadie-usa', costoBcrypt);
  const credencialesInvalidas = () => new UnauthorizedError(MENSAJES.auth.credencialesInvalidas);

  return {
    async registrar({ nombre, email, password }) {
      if (await usuarioRepository.buscarPorEmail(email))
        throw new ConflictError(MENSAJES.auth.correoRegistrado);

      const passwordHash = await bcrypt.hash(password, costoBcrypt);
      let usuario;
      try {
        usuario = await usuarioRepository.crear({
          tenantId: uuid(),
          nombre,
          email,
          passwordHash,
          rol: ROLES.USUARIO,
        });
      } catch (error) {
        // Dos registros simultáneos con el mismo correo: el índice único decide.
        if (error?.code === 11000) throw new ConflictError(MENSAJES.auth.correoRegistrado);
        throw error;
      }

      // Un fallo de SMTP no deshace el registro: la cuenta ya existe.
      try {
        await correo.enviar({
          para: usuario.email,
          ...correoBienvenida({ nombre: usuario.nombre, urlInicio: `${config.clientUrl}/iniciar-sesion` }),
        });
      } catch (error) {
        logger.error({ err: error }, 'no se pudo enviar el correo de bienvenida');
      }
      return usuario;
    },

    /** @returns {{ usuario: object, acceso: string, renovacion: string, expiraAbsoluta: Date }} */
    async iniciarSesion({ email, password }) {
      const usuario = await usuarioRepository.buscarPorEmail(email);
      if (!usuario || !usuario.activo) {
        await bcrypt.compare(password, hashFalso);
        throw credencialesInvalidas();
      }

      const ahora = reloj.ahora();
      // Con el bloqueo vigente ni siquiera se comprueba la contraseña: no hay forma de adivinarla.
      if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
        const minutos = Math.ceil((usuario.bloqueadoHasta - ahora) / 60_000);
        throw new TooManyRequestsError(MENSAJES.auth.bloqueado(minutos), {
          bloqueadoHasta: usuario.bloqueadoHasta,
        });
      }

      if (!(await bcrypt.compare(password, usuario.passwordHash))) {
        const actualizado = await usuarioRepository.registrarFallo(usuario._id, {
          maximo: MAX_INTENTOS,
          bloqueoHasta: sumarMinutos(ahora, BLOQUEO_MIN),
          ahora,
        });
        if (actualizado?.bloqueadoHasta) {
          // El tercer fallo responde "Credenciales inválidas" y avisa del bloqueo que empieza.
          throw new TooManyRequestsError(MENSAJES.auth.credencialesInvalidas, {
            bloqueadoHasta: actualizado.bloqueadoHasta,
          });
        }
        throw credencialesInvalidas();
      }

      if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta)
        await usuarioRepository.reiniciarIntentos(usuario._id);
      return { usuario, ...(await sesiones.iniciar(usuario)) };
    },
  };
}
