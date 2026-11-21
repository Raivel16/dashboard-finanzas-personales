// Cookies de sesión: ambas httpOnly y sameSite=lax, secure en producción (ver el diseño, decisión 7).
import { duracionAMs } from './tokens.js';

export const COOKIE_ACCESO = 'access_token';
export const COOKIE_RENOVACION = 'refresh_token';
/** El token de renovación solo viaja a los endpoints de autenticación. */
export const RUTA_RENOVACION = '/api/v1/auth';

const base = (config) => ({ httpOnly: true, sameSite: 'lax', secure: config.esProduccion });

export function fijarCookiesSesion(res, config, { acceso, renovacion, expiraAbsoluta }, ahora) {
  res.cookie(COOKIE_ACCESO, acceso, { ...base(config), path: '/', maxAge: duracionAMs(config.jwt.ttl) });
  // Si no hubo rotación (ventana de gracia) la cookie de renovación existente se conserva.
  if (renovacion) {
    res.cookie(COOKIE_RENOVACION, renovacion, {
      ...base(config),
      path: RUTA_RENOVACION,
      maxAge: Math.max(expiraAbsoluta.getTime() - ahora.getTime(), 0),
    });
  }
}

export function borrarCookiesSesion(res, config) {
  res.clearCookie(COOKIE_ACCESO, { ...base(config), path: '/' });
  res.clearCookie(COOKIE_RENOVACION, { ...base(config), path: RUTA_RENOVACION });
}
