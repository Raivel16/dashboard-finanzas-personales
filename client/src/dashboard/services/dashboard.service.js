import { api } from '../../shared/api/clienteHttp.js';

/** Una respuesta que no tiene la forma esperada se trata como un error de carga, nunca como datos. */
function exigir(datos, valido) {
  if (!valido(datos)) throw new Error('Respuesta inesperada del servidor');
  return datos;
}

/** Monedas que la persona usa y su moneda principal. */
export const obtenerMonedas = ({ signal } = {}) =>
  api.get('/dashboard/monedas', { signal }).then((r) => exigir(r.data, (d) => Array.isArray(d?.monedas)));

/** Ingresos, gastos, balance y avance del presupuesto general del mes y la moneda. */
export const obtenerIndicadores = ({ periodo, moneda, signal } = {}) =>
  api
    .get('/dashboard/indicadores', { consulta: { periodo, moneda }, signal })
    .then((r) => exigir(r.data, (d) => typeof d?.ingresos === 'string'));

/** Evolución de los últimos 6 meses y distribución de los gastos del mes por categoría. */
export const obtenerGraficos = ({ periodo, moneda, signal } = {}) =>
  api
    .get('/dashboard/graficos', { consulta: { periodo, moneda }, signal })
    .then((r) => exigir(r.data, (d) => Array.isArray(d?.evolucion) && Array.isArray(d?.distribucion?.items)));
