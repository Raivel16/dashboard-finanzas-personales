import { api } from '../../shared/api/clienteHttp.js';

/** @returns {Promise<{ items: object[], meta: { page, limit, total, totalPages } }>} */
export async function listarUsuarios({ q, page, limit }, { signal } = {}) {
  const { data, meta } = await api.get('/admin/usuarios', { consulta: { q, page, limit }, signal });
  return { items: data, meta };
}

export const obtenerUsuario = (id, { signal } = {}) =>
  api.get(`/admin/usuarios/${id}`, { signal }).then((r) => r.data);

export const cambiarRol = (id, rol) => api.patch(`/admin/usuarios/${id}/rol`, { rol }).then((r) => r.data);
