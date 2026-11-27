// Filtros del historial de movimientos (ya validados por el esquema compartido) en el formato de la base de datos.
// Los comparten el historial y los reportes exportables para que ambos vean exactamente los mismos movimientos.
import { textoADate } from './fechas.js';

const id = (valor) => String(valor);

export function filtroDeMovimientos({ desde, hasta, tipo, categoriaId, cuentaId, moneda }) {
  const fecha = {
    ...(desde && { $gte: textoADate(desde) }),
    ...(hasta && { $lte: textoADate(hasta) }),
  };
  return {
    ...(Object.keys(fecha).length > 0 && { fecha }),
    ...(tipo && { tipo }),
    ...(categoriaId && { categoriaId: id(categoriaId) }),
    ...(cuentaId && { cuentaId: id(cuentaId) }),
    ...(moneda && { moneda }),
  };
}
