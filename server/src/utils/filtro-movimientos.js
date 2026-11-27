// Filtros del historial de movimientos (ya validados por el esquema compartido) en el formato de la base de datos.
// Los comparten el historial y los reportes exportables para que ambos vean exactamente los mismos movimientos.
import mongoose from 'mongoose';
import { textoADate } from './fechas.js';

const id = (valor) => new mongoose.Types.ObjectId(valor);

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
