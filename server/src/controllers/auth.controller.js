// Capa HTTP de autenticación: traduce solicitud y respuesta; la lógica está en los servicios.
import { MENSAJES } from '@finanzas/shared';
import {
  borrarCookiesSesion,
  COOKIE_ACCESO,
  COOKIE_RENOVACION,
  fijarCookiesSesion,
} from '../utils/cookies.js';
import { cuerpoExito } from '../views/respuesta.view.js';
import { usuarioJson } from '../views/usuario.view.js';

export function crearAuthController({ config, reloj, auth, sesiones, recuperacion }) {
  return {
    async registro(req, res) {
      const usuario = await auth.registrar(req.datos);
      res.status(201).json(cuerpoExito(usuarioJson(usuario)));
    },

    async login(req, res) {
      const { usuario, ...tokens } = await auth.iniciarSesion(req.datos);
      fijarCookiesSesion(res, config, tokens, reloj.ahora());
      res.json(cuerpoExito(usuarioJson(usuario)));
    },

    async refresh(req, res) {
      const { usuario, ...tokens } = await sesiones.renovar(req.cookies?.[COOKIE_RENOVACION]);
      fijarCookiesSesion(res, config, tokens, reloj.ahora());
      res.json(cuerpoExito(usuarioJson(usuario)));
    },

    async logout(req, res) {
      await sesiones.cerrar({
        tokenRenovacion: req.cookies?.[COOKIE_RENOVACION],
        tokenAcceso: req.cookies?.[COOKIE_ACCESO],
      });
      borrarCookiesSesion(res, config);
      res.status(204).end();
    },

    me(req, res) {
      res.json(cuerpoExito(usuarioJson(req.usuario)));
    },

    async olvideContrasena(req, res) {
      await recuperacion.solicitar(req.datos);
      res.json(cuerpoExito({ mensaje: MENSAJES.auth.recuperacionSolicitada }));
    },

    async restablecerContrasena(req, res) {
      await recuperacion.restablecer(req.datos);
      res.json(cuerpoExito({ mensaje: MENSAJES.auth.contrasenaRestablecida }));
    },
  };
}
