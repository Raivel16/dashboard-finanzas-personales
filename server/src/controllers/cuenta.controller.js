// Capa HTTP de las cuentas. Nunca toca modelos ni repositorios.
import { cuerpoExito, cuerpoLista } from '../views/respuesta.view.js';
import { cuentaJson } from '../views/cuenta.view.js';

export function crearCuentaController({ cuentas }) {
  return {
    async listar(req, res) {
      const { items, total } = await cuentas.listar(req.usuario, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(cuentaJson), { page, limit, total }));
    },

    async obtener(req, res) {
      res.json(cuerpoExito(cuentaJson(await cuentas.obtener(req.usuario, req.params.id))));
    },

    async crear(req, res) {
      const cuenta = await cuentas.crear(req.usuario, req.datos);
      res.status(201).json(cuerpoExito(cuentaJson(cuenta)));
    },

    async actualizar(req, res) {
      const cuenta = await cuentas.actualizar(req.usuario, req.params.id, req.datos);
      res.json(cuerpoExito(cuentaJson(cuenta)));
    },

    async eliminar(req, res) {
      await cuentas.eliminar(req.usuario, req.params.id);
      res.status(204).end();
    },

    /** Lectura de administrador: GET /admin/usuarios/:id/cuentas. */
    async listarDeUsuario(req, res) {
      const { items, total } = await cuentas.listarDeUsuario(req.usuario, req.params.id, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(cuentaJson), { page, limit, total }));
    },
  };
}
