import { api } from '../../shared/api/clienteHttp.js';

/** Estado de la API y de la base de datos (GET /api/v1/health). */
export async function obtenerEstadoSistema({ signal } = {}) {
  const { data } = await api.get('/health', { signal });
  return data;
}
