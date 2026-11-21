import { estadoBaseDatos } from '../config/baseDatos.js';

/** Estado de la API y de la base de datos para el endpoint de salud. */
export async function obtenerEstado() {
  const bd = await estadoBaseDatos();
  return { api: 'ok', baseDatos: bd.conectada ? 'ok' : 'error', replicaSet: bd.replicaSet };
}
