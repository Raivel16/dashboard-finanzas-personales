// Autenticación de cada solicitud y cabeceras de caché de las rutas con datos de sesión.
import { COOKIE_ACCESO } from '../utils/cookies.js';

/** Valida el token de acceso de la cookie y deja el usuario y la sesión en la solicitud. */
export const crearAutenticar = (sesiones) => async (req, _res, next) => {
  const { usuario, sesion } = await sesiones.autenticar(req.cookies?.[COOKIE_ACCESO]);
  req.usuario = {
    id: String(usuario._id),
    tenantId: usuario.tenantId,
    rol: usuario.rol,
    nombre: usuario.nombre,
    email: usuario.email,
    monedaPrincipal: usuario.monedaPrincipal,
    idioma: usuario.idioma,
    textoGrande: usuario.textoGrande,
    altoContraste: usuario.altoContraste,
  };
  req.sesionId = String(sesion._id);
  next();
};

/** Evita que el navegador guarde respuestas con datos de sesión ("Atrás" tras cerrar sesión). */
export const sinCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
