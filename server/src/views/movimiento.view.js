// Representación JSON de un movimiento. El monto sale como texto con dos decimales y la fecha como AAAA-MM-DD.
import { montoATexto } from '../utils/dinero.js';
import { dateATexto } from '../utils/fechas.js';

export function movimientoJson(movimiento) {
  return {
    id: String(movimiento.id ?? movimiento._id),
    tipo: movimiento.tipo,
    monto: montoATexto(movimiento.monto),
    moneda: movimiento.moneda,
    fecha: dateATexto(movimiento.fecha),
    categoriaId: String(movimiento.categoriaId),
    cuentaId: String(movimiento.cuentaId),
    descripcion: movimiento.descripcion ?? '',
    ...(movimiento.saldoResultante !== undefined && { saldoResultante: montoATexto(movimiento.saldoResultante) }),
    creadoEn: movimiento.createdAt,
  };
}
