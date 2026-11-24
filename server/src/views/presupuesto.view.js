// Representación JSON de un presupuesto y de su seguimiento. Los montos salen como texto con dos decimales.
import { montoATexto } from '../utils/dinero.js';

export function presupuestoJson(presupuesto) {
  return {
    id: String(presupuesto.id ?? presupuesto._id),
    periodo: presupuesto.periodo,
    moneda: presupuesto.moneda,
    categoriaId: presupuesto.categoriaId ? String(presupuesto.categoriaId) : null,
    monto: montoATexto(presupuesto.monto),
    creadoEn: presupuesto.createdAt,
    actualizadoEn: presupuesto.updatedAt,
  };
}

/** Un presupuesto con su avance: `porcentaje` puede pasar de 100 y entonces `sobregiro` es lo que se excedió. */
export function seguimientoJson({ presupuesto, gastado, restante, porcentaje, excedido, sobregiro, sinAsignar }) {
  return {
    ...presupuestoJson(presupuesto),
    gastado: montoATexto(gastado),
    restante: montoATexto(restante),
    porcentaje: Number(porcentaje),
    excedido,
    sobregiro: montoATexto(sobregiro),
    ...(sinAsignar !== undefined && { sinAsignar: montoATexto(sinAsignar) }),
  };
}

export function alertaJson({ presupuestoId, umbral, porcentaje, categoriaId }) {
  return { presupuestoId: String(presupuestoId), umbral, porcentaje: Number(porcentaje), categoriaId: categoriaId ? String(categoriaId) : null };
}
