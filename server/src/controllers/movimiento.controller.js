// Capa HTTP de los movimientos. Nunca toca modelos ni repositorios.
import { cuerpoExito, cuerpoLista } from '../views/respuesta.view.js';
import { movimientoJson } from '../views/movimiento.view.js';
import { alertaJson } from '../views/presupuesto.view.js';

/** Las advertencias (p. ej. saldo insuficiente) viajan en `meta` sin bloquear la operación. */
const conAvisos = ({ movimiento, advertencias, alertas = [] }) => {
  const meta = {
    ...(advertencias.length > 0 && { advertencias }),
    ...(alertas.length > 0 && { alertas: alertas.map(alertaJson) }),
  };
  return cuerpoExito(movimientoJson(movimiento), Object.keys(meta).length > 0 ? meta : undefined);
};

export function crearMovimientoController({ movimientos }) {
  return {
    async listar(req, res) {
      const { items, total } = await movimientos.listar(req.usuario, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(movimientoJson), { page, limit, total }));
    },

    async obtener(req, res) {
      res.json(cuerpoExito(movimientoJson(await movimientos.obtener(req.usuario, req.params.id))));
    },

    async crear(req, res) {
      res.status(201).json(conAvisos(await movimientos.crear(req.usuario, req.body)));
    },

    async actualizar(req, res) {
      res.json(conAvisos(await movimientos.actualizar(req.usuario, req.params.id, req.body)));
    },

    async eliminar(req, res) {
      await movimientos.eliminar(req.usuario, req.params.id);
      res.status(204).end();
    },

    /** Lectura de administrador: GET /admin/usuarios/:id/movimientos. */
    async listarDeUsuario(req, res) {
      const { items, total } = await movimientos.listarDeUsuario(req.usuario, req.params.id, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(movimientoJson), { page, limit, total }));
    },
  };
}
