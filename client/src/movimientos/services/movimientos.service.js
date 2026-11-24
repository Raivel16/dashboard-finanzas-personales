import { api } from '../../shared/api/clienteHttp.js';

/** Página del historial (con filtros desde, hasta, tipo, categoriaId y cuentaId) y su saldo resultante: { data, meta } (meta lleva page, limit, total y totalPages). */
export const listarMovimientos = ({ page = 1, limit = 20, filtros = {}, signal } = {}) =>
  api.get('/movimientos', { consulta: { page, limit, ...filtros }, signal });

/** Devuelven { data, meta }: meta.advertencias trae, por ejemplo, el aviso de saldo insuficiente. */
export const crearMovimiento = (cuerpo) => api.post('/movimientos', cuerpo);

export const actualizarMovimiento = (id, cuerpo) => api.patch(`/movimientos/${id}`, cuerpo);

export const eliminarMovimiento = (id) => api.delete(`/movimientos/${id}`);

/** Lectura de administrador: los movimientos recientes de otra persona (solo lectura). */
export const listarMovimientosDeUsuario = (usuarioId, { signal } = {}) =>
  api.get(`/admin/usuarios/${usuarioId}/movimientos`, { consulta: { limit: 20 }, signal });
