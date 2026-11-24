// Capa HTTP de los presupuestos. Nunca toca modelos ni repositorios.
import { cuerpoExito, cuerpoLista } from '../views/respuesta.view.js';
import { presupuestoJson, seguimientoJson } from '../views/presupuesto.view.js';

export function crearPresupuestoController({ presupuestos }) {
  return {
    async listar(req, res) {
      const { items, total } = await presupuestos.listar(req.usuario, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(presupuestoJson), { page, limit, total }));
    },

    async seguimiento(req, res) {
      const { periodo, moneda, items } = await presupuestos.seguimiento(req.usuario, req.consulta);
      res.json(cuerpoExito(items.map(seguimientoJson), { periodo, ...(moneda && { moneda }) }));
    },

    async crear(req, res) {
      res.status(201).json(cuerpoExito(presupuestoJson(await presupuestos.crear(req.usuario, req.datos))));
    },

    async reemplazar(req, res) {
      const presupuesto = await presupuestos.reemplazar(req.usuario, req.params.id, req.datos);
      res.json(cuerpoExito(presupuestoJson(presupuesto)));
    },

    async eliminar(req, res) {
      await presupuestos.eliminar(req.usuario, req.params.id);
      res.status(204).end();
    },

    /** Lectura de administrador: GET /admin/usuarios/:id/presupuestos. */
    async listarDeUsuario(req, res) {
      const { items, total } = await presupuestos.listarDeUsuario(req.usuario, req.params.id, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(presupuestoJson), { page, limit, total }));
    },
  };
}
