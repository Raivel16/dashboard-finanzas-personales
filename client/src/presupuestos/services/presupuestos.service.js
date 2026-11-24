import { api } from '../../shared/api/clienteHttp.js';

const LIMITE = 100; // máximo permitido por la API

/** Presupuestos de un mes con su avance: { data, meta } (meta lleva el período consultado). */
export const obtenerSeguimiento = ({ periodo, moneda, signal } = {}) =>
  api.get('/presupuestos/seguimiento', { consulta: { periodo, moneda }, signal });

export const crearPresupuesto = (cuerpo) => api.post('/presupuestos', cuerpo).then((r) => r.data);

/** Reemplaza el monto de un presupuesto existente. */
export const reemplazarPresupuesto = (id, cuerpo) => api.put(`/presupuestos/${id}`, cuerpo).then((r) => r.data);

export const eliminarPresupuesto = (id) => api.delete(`/presupuestos/${id}`);

/** Lectura de administrador: los presupuestos de otra persona (solo lectura). */
export const listarPresupuestosDeUsuario = (usuarioId, { signal } = {}) =>
  api.get(`/admin/usuarios/${usuarioId}/presupuestos`, { consulta: { limit: LIMITE }, signal }).then((r) => r.data);
