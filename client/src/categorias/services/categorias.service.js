import { api } from '../../shared/api/clienteHttp.js';

const LIMITE = 100; // máximo permitido por la API

/** Todas las categorías propias, ordenadas por tipo y nombre. */
export const listarCategorias = ({ signal } = {}) =>
  api.get('/categorias', { consulta: { limit: LIMITE }, signal }).then((r) => r.data);

export const crearCategoria = (cuerpo) => api.post('/categorias', cuerpo).then((r) => r.data);

export const actualizarCategoria = (id, cuerpo) => api.patch(`/categorias/${id}`, cuerpo).then((r) => r.data);

export const eliminarCategoria = (id) => api.delete(`/categorias/${id}`);

/** Lectura de administrador: las categorías de otra persona (solo lectura). */
export const listarCategoriasDeUsuario = (usuarioId, { signal } = {}) =>
  api
    .get(`/admin/usuarios/${usuarioId}/categorias`, { consulta: { limit: LIMITE }, signal })
    .then((r) => r.data);
