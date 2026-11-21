// Capa HTTP del perfil. El identificador sale siempre de la sesión, nunca del cuerpo ni de la URL.
import { MENSAJES } from '@finanzas/shared';
import { cuerpoExito } from '../views/respuesta.view.js';
import { usuarioJson } from '../views/usuario.view.js';

export function crearPerfilController({ perfil }) {
  return {
    async actualizar(req, res) {
      const usuario = await perfil.actualizar(req.usuario.id, req.datos);
      res.json(cuerpoExito(usuarioJson(usuario)));
    },

    async cambiarContrasena(req, res) {
      await perfil.cambiarContrasena(req.usuario.id, req.sesionId, req.datos);
      res.json(cuerpoExito({ mensaje: MENSAJES.auth.contrasenaCambiada }));
    },
  };
}
