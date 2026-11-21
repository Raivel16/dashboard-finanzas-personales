// Errores de dominio. El manejador central los traduce al formato { error: { code, message, details } }.
import { CODIGOS_ERROR, MENSAJES } from '@finanzas/shared';

export class AppError extends Error {
  constructor(mensaje, { estado = 500, codigo = CODIGOS_ERROR.INTERNAL_ERROR, detalles } = {}) {
    super(mensaje);
    this.name = this.constructor.name;
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export class ValidationError extends AppError {
  constructor(detalles = [], mensaje = 'Los datos enviados no son válidos') {
    super(mensaje, { estado: 400, codigo: CODIGOS_ERROR.VALIDATION_ERROR, detalles });
  }
}

export class UnauthorizedError extends AppError {
  constructor(mensaje = MENSAJES.generales.sesionExpirada, codigo = CODIGOS_ERROR.UNAUTHORIZED) {
    super(mensaje, { estado: 401, codigo });
  }
}

export class ForbiddenError extends AppError {
  constructor(mensaje = MENSAJES.generales.noAutorizado) {
    super(mensaje, { estado: 403, codigo: CODIGOS_ERROR.FORBIDDEN });
  }
}

// Un recurso de otro inquilino es indistinguible de uno inexistente.
export class NotFoundError extends AppError {
  constructor(mensaje = MENSAJES.generales.noExiste) {
    super(mensaje, { estado: 404, codigo: CODIGOS_ERROR.NOT_FOUND });
  }
}

export class ConflictError extends AppError {
  constructor(mensaje, detalles) {
    super(mensaje, { estado: 409, codigo: CODIGOS_ERROR.CONFLICT, detalles });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(mensaje = MENSAJES.generales.demasiadosIntentos, detalles) {
    super(mensaje, { estado: 429, codigo: CODIGOS_ERROR.TOO_MANY_REQUESTS, detalles });
  }
}

export class ConfigurationError extends Error {
  constructor(mensaje, problemas = []) {
    super(mensaje);
    this.name = 'ConfigurationError';
    this.problemas = problemas;
  }
}
