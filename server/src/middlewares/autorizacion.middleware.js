// Restringe una ruta a ciertos roles. Va después de `autenticar`, que deja el rol VIGENTE (leído de la base)
// en req.usuario: una degradación durante la sesión se aplica en la siguiente solicitud.
export const crearRequerirRol =
  (autorizacion) =>
  (...roles) =>
  (req, _res, next) => {
    autorizacion.exigirRol(req.usuario, roles, { metodo: req.method, ruta: req.originalUrl });
    next();
  };
