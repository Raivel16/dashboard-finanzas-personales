// Perfil de la persona autenticada: datos editables y cambio de contraseña.
import bcrypt from 'bcrypt';
import { MENSAJES } from '@finanzas/shared';
import { NotFoundError, TooManyRequestsError, ValidationError } from '../utils/errores.js';
import { sumarMinutos } from '../utils/reloj.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { correoContrasenaActualizada } from '../views/correo.view.js';
import { BLOQUEO_MIN, MAX_INTENTOS } from './auth.service.js';

export function crearPerfilService({ reloj, correo, logger, sesiones, costoBcrypt = 12 }) {
  return {
    /** Actualiza nombre y moneda principal. El correo no forma parte de los datos recibidos. */
    async actualizar(usuarioId, datos) {
      const usuario = await usuarioRepository.actualizarPerfil(usuarioId, datos);
      if (!usuario) throw new NotFoundError();
      return usuario;
    },

    /** Cambia el idioma o las preferencias de accesibilidad; exige al menos una. */
    async actualizarPreferencias(usuarioId, preferencias) {
      if (Object.keys(preferencias).length === 0) {
        throw new ValidationError([{ campo: 'idioma', mensaje: MENSAJES.cuenta.sinCambios }]);
      }
      const usuario = await usuarioRepository.actualizarPreferencias(usuarioId, preferencias);
      if (!usuario) throw new NotFoundError();
      return usuario;
    },

    async cambiarContrasena(usuarioId, sesionId, { passwordActual, passwordNueva }) {
      const usuario = await usuarioRepository.buscarPorId(usuarioId);
      if (!usuario) throw new NotFoundError();

      // Mismo contador y bloqueo que el inicio de sesión: una sesión robada no puede adivinar la actual.
      const ahora = reloj.ahora();
      const reservado = await usuarioRepository.reservarIntento(usuario._id, {
        maximo: MAX_INTENTOS,
        bloqueoHasta: sumarMinutos(ahora, BLOQUEO_MIN),
        ahora,
      });
      if (!reservado) {
        const actual = await usuarioRepository.buscarPorId(usuario._id);
        const hasta = actual?.bloqueadoHasta ?? sumarMinutos(ahora, BLOQUEO_MIN);
        throw new TooManyRequestsError(
          MENSAJES.auth.bloqueado(Math.max(1, Math.ceil((hasta - ahora) / 60_000))),
          {
            bloqueadoHasta: hasta,
          },
        );
      }

      if (!(await bcrypt.compare(passwordActual, usuario.passwordHash))) {
        if (reservado.bloqueadoHasta) {
          throw new TooManyRequestsError(MENSAJES.auth.bloqueado(BLOQUEO_MIN), {
            bloqueadoHasta: reservado.bloqueadoHasta,
          });
        }
        throw new ValidationError([
          { campo: 'passwordActual', mensaje: MENSAJES.auth.contrasenaActualIncorrecta },
        ]);
      }
      await usuarioRepository.reiniciarIntentos(usuario._id);

      // La comparación va después de verificar la actual: no se revela nada a quien no la conoce.
      if (passwordNueva === passwordActual) {
        throw new ValidationError([{ campo: 'passwordNueva', mensaje: MENSAJES.auth.contrasenaNuevaIgual }]);
      }

      await usuarioRepository.actualizarPassword(usuario._id, await bcrypt.hash(passwordNueva, costoBcrypt));
      await sesiones.revocarOtras(usuario._id, sesionId);

      // El aviso no bloquea la respuesta ni la deshace si falla.
      correo
        .enviar({
          para: usuario.email,
          ...correoContrasenaActualizada({ nombre: usuario.nombre, conservaSesion: true, idioma: usuario.idioma }),
        })
        .catch((error) =>
          logger.error({ err: error }, 'no se pudo enviar el aviso de contraseña actualizada'),
        );
    },
  };
}
