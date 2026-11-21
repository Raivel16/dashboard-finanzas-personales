import { cuerpoExito, cuerpoLista } from '../views/respuesta.view.js';
import { usuarioAdminJson } from '../views/usuario.view.js';

export function crearAdminController({ admin }) {
  return {
    async listarUsuarios(req, res) {
      const { items, total } = await admin.listarUsuarios(req.usuario, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(usuarioAdminJson), { page, limit, total }));
    },

    async obtenerUsuario(req, res) {
      const usuario = await admin.obtenerUsuario(req.usuario, req.params.id);
      res.json(cuerpoExito(usuarioAdminJson(usuario)));
    },

    async cambiarRol(req, res) {
      const usuario = await admin.cambiarRol(req.usuario, req.params.id, req.datos.rol);
      res.json(cuerpoExito(usuarioAdminJson(usuario)));
    },
  };
}
