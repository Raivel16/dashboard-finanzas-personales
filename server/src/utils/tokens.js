// Tokens de sesión y de recuperación. Los valores opacos nunca se guardan: solo su hash SHA-256.
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { CODIGOS_ERROR, MENSAJES } from '@finanzas/shared';
import { UnauthorizedError } from './errores.js';

const ALGORITMO = 'HS256';

/** Valor aleatorio de 32 bytes en base64url (renovación y recuperación de contraseña). */
export const generarTokenOpaco = () => randomBytes(32).toString('base64url');

export const hashToken = (valor) => createHash('sha256').update(String(valor)).digest('hex');

/**
 * Token de acceso: JWT de corta duración con el usuario, su inquilino, su rol y la sesión a la que pertenece.
 * El tiempo se toma del reloj inyectado para poder probar la expiración.
 */
export function firmarTokenAcceso({ usuarioId, tenantId, rol, sesionId }, { secreto, ttl }, ahora) {
  return jwt.sign(
    { tenantId, rol, sid: String(sesionId), iat: Math.floor(ahora.getTime() / 1000) },
    secreto,
    { algorithm: ALGORITMO, subject: String(usuarioId), expiresIn: ttl },
  );
}

/** @throws {UnauthorizedError} TOKEN_EXPIRED si venció; UNAUTHORIZED si falta, está alterado o no es válido. */
export function verificarTokenAcceso(token, { secreto }, ahora) {
  if (!token) throw new UnauthorizedError(MENSAJES.generales.noAutorizado);
  try {
    const carga = jwt.verify(token, secreto, {
      algorithms: [ALGORITMO],
      clockTimestamp: Math.floor(ahora.getTime() / 1000),
    });
    return { usuarioId: carga.sub, tenantId: carga.tenantId, rol: carga.rol, sesionId: carga.sid };
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw new UnauthorizedError(MENSAJES.generales.sesionExpirada, CODIGOS_ERROR.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError(MENSAJES.generales.noAutorizado);
  }
}
