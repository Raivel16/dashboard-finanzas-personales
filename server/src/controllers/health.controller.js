import { obtenerEstado } from '../services/health.service.js';
import { cuerpoExito } from '../views/respuesta.view.js';

export async function obtener(_req, res) {
  res.json(cuerpoExito(await obtenerEstado()));
}
