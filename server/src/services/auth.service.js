// Registro e inicio de sesión. La recuperación de contraseña vive en recuperacion.service.js.
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { MENSAJES, ROLES } from '@finanzas/shared';
import mongoose from 'mongoose';
import { AppError, ConflictError, TooManyRequestsError, UnauthorizedError } from '../utils/errores.js';
import { sumarMinutos } from '../utils/reloj.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { crearPredeterminadas } from '../repositories/categoria.repository.js';
import { correoBienvenida } from '../views/correo.view.js';

export const MAX_INTENTOS = 3;
export const BLOQUEO_MIN = 5;

export function crearAuthService({
  config,
  reloj,
  correo,
  logger,
  sesiones,
  costoBcrypt = 12,
  crearCategoriasIniciales = crearPredeterminadas, // se inyecta otra en las pruebas de fallo (HU-24)
}) {
  // Se compara contra un hash falso cuando el correo no existe, para que el tiempo no delate la cuenta.
  const hashFalso = bcrypt.hashSync('contraseña-que-nadie-usa', costoBcrypt);
  const credencialesInvalidas = () => new UnauthorizedError(MENSAJES.auth.credencialesInvalidas);

  return {
    async registrar({ nombre, email, password, idioma }) {
      if (await usuarioRepository.buscarPorEmail(email))
        throw new ConflictError(MENSAJES.auth.correoRegistrado);

      const passwordHash = await bcrypt.hash(password, costoBcrypt);
      // El usuario y sus categorías predeterminadas se crean juntos o no se crea nada (HU-24).
      const tenantId = uuid();
      let usuario;
      const sesionBd = await mongoose.startSession();
      try {
        await sesionBd.withTransaction(async () => {
          usuario = await usuarioRepository.crear(
            { tenantId, nombre, email, passwordHash, rol: ROLES.USUARIO, idioma },
            { session: sesionBd },
          );
          await crearCategoriasIniciales({ tenantId, usuarioId: usuario._id, idioma }, { session: sesionBd });
        });
      } catch (error) {
        // Dos registros simultáneos con el mismo correo: el índice único decide.
        if (error?.code === 11000) throw new ConflictError(MENSAJES.auth.correoRegistrado);
        logger.error({ err: error }, 'no se pudo completar el registro');
        throw new AppError(MENSAJES.auth.registroFallido);
      } finally {
        await sesionBd.endSession();
      }

      // Un fallo de SMTP no deshace el registro: la cuenta ya existe.
      try {
        await correo.enviar({
          para: usuario.email,
          ...correoBienvenida({
            nombre: usuario.nombre,
            urlInicio: `${config.clientUrl}/iniciar-sesion`,
            idioma: usuario.idioma,
          }),
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
      const bloqueado = (hasta) => {
        const minutos = Math.ceil((hasta - ahora) / 60_000);
        return new TooManyRequestsError(MENSAJES.auth.bloqueado(minutos), { bloqueadoHasta: hasta });
      };
      // Con el bloqueo vigente ni siquiera se comprueba la contrase�a: no hay forma de adivinarla.
      if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) throw bloqueado(usuario.bloqueadoHasta);

      // El intento se reserva de forma at�mica ANTES de comprobar la contrase�a: as�, peticiones
      // simult�neas no pueden pasar todas el control de bloqueo y burlar el l�mite de intentos.
      const reservado = await usuarioRepository.reservarIntento(usuario._id, {
        maximo: MAX_INTENTOS,
        bloqueoHasta: sumarMinutos(ahora, BLOQUEO_MIN),
        ahora,
      });
      if (!reservado) {
        const actual = await usuarioRepository.buscarPorId(usuario._id);
        throw bloqueado(actual?.bloqueadoHasta ?? sumarMinutos(ahora, BLOQUEO_MIN));
      }

      if (!(await bcrypt.compare(password, usuario.passwordHash))) {
        if (reservado.bloqueadoHasta) {
          // El tercer fallo responde "Credenciales inv�lidas" y avisa del bloqueo que empieza.
          throw new TooManyRequestsError(MENSAJES.auth.credencialesInvalidas, {
            bloqueadoHasta: reservado.bloqueadoHasta,
          });
        }
        throw credencialesInvalidas();
      }

      await usuarioRepository.reiniciarIntentos(usuario._id);
      return { usuario, ...(await sesiones.iniciar(usuario)) };
    },
  };
}
