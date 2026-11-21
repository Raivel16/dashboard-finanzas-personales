// Manejadores centrales: 404 de rutas y traducción de cualquier error al contrato de la API.
import { CODIGOS_ERROR, MENSAJES } from '@finanzas/shared';
import { AppError } from '../utils/errores.js';
import { cuerpoError } from '../views/respuesta.view.js';

export function rutaNoEncontrada(_req, _res, next) {
  next(new AppError(MENSAJES.generales.noExiste, { estado: 404, codigo: CODIGOS_ERROR.NOT_FOUND }));
}

/** Traduce errores conocidos de librerías (JSON inválido, Mongoose) a errores de dominio. */
function normalizar(error) {
  if (error instanceof AppError) return error;
  if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
    return new AppError('El cuerpo de la solicitud no es un JSON válido', {
      estado: error.type === 'entity.too.large' ? 413 : 400,
      codigo: CODIGOS_ERROR.VALIDATION_ERROR,
    });
  }
  if (error?.code === 11000) {
    return new AppError('Ya existe un registro con esos datos', {
      estado: 409,
      codigo: CODIGOS_ERROR.CONFLICT,
    });
  }
  if (error?.name === 'CastError') {
    return new AppError(MENSAJES.generales.noExiste, { estado: 404, codigo: CODIGOS_ERROR.NOT_FOUND });
  }
  if (error?.name === 'ValidationError' && error.errors) {
    const detalles = Object.values(error.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
    return new AppError('Los datos enviados no son válidos', {
      estado: 400,
      codigo: CODIGOS_ERROR.VALIDATION_ERROR,
      detalles,
    });
  }
  return null;
}

// Express reconoce un manejador de errores por sus 4 parámetros.
// eslint-disable-next-line no-unused-vars
export const manejadorErrores = (logger) => (error, req, res, _next) => {
  const conocido = normalizar(error);
  if (conocido) {
    if (conocido.estado >= 500) logger.error({ err: error }, 'error de aplicación');
    return res
      .status(conocido.estado)
      .json(cuerpoError({ codigo: conocido.codigo, mensaje: conocido.message, detalles: conocido.detalles }));
  }
  // Falla inesperada: se registra completa pero nunca se expone al cliente.
  (req.log ?? logger).error({ err: error }, 'error inesperado');
  return res
    .status(500)
    .json(cuerpoError({ codigo: CODIGOS_ERROR.INTERNAL_ERROR, mensaje: MENSAJES.generales.errorInterno }));
};
