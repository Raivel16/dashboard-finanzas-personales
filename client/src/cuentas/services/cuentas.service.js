import { api } from '../../shared/api/clienteHttp.js';

const LIMITE = 100; // máximo permitido por la API

/** Todas las cuentas propias, ordenadas por nombre. */
export const listarCuentas = ({ signal } = {}) =>
  api.get('/cuentas', { consulta: { limit: LIMITE }, signal }).then((r) => r.data);

export const crearCuenta = (cuerpo) => api.post('/cuentas', cuerpo).then((r) => r.data);

export const actualizarCuenta = (id, cuerpo) => api.patch(`/cuentas/${id}`, cuerpo).then((r) => r.data);

export const eliminarCuenta = (id) => api.delete(`/cuentas/${id}`);

/** Lectura de administrador: las cuentas de otra persona (solo lectura). */
export const listarCuentasDeUsuario = (usuarioId, { signal } = {}) =>
  api.get(`/admin/usuarios/${usuarioId}/cuentas`, { consulta: { limit: LIMITE }, signal }).then((r) => r.data);
