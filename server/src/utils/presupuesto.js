// Cálculos de presupuestos con decimal.js: nunca con Number.
import Decimal from 'decimal.js';
import { UMBRALES_PRESUPUESTO } from '@finanzas/shared';

const dec = (valor) => new Decimal(String(valor));

/** Porcentaje del presupuesto usado, con 2 decimales (0 si el presupuesto es cero). */
export function porcentajeUsado(gastado, monto) {
  const total = dec(monto);
  return total.isZero() ? new Decimal(0) : dec(gastado).div(total).times(100).toDecimalPlaces(2);
}

/** Avance de un presupuesto: lo gastado, lo que queda, el porcentaje y, si se pasó, cuánto. */
export function avance(monto, gastado) {
  const restante = dec(monto).minus(dec(gastado));
  const excedido = restante.isNegative();
  return {
    gastado: dec(gastado),
    restante: excedido ? new Decimal(0) : restante,
    porcentaje: porcentajeUsado(gastado, monto),
    excedido,
    sobregiro: excedido ? restante.abs() : new Decimal(0),
  };
}

/** Umbral que se cruzó al pasar de `antes` a `despues` (porcentajes): 100 si se excedió, 90 si llegó a la alerta, o null. */
export function umbralCruzado(antes, despues) {
  const a = dec(antes);
  const d = dec(despues);
  if (a.lte(UMBRALES_PRESUPUESTO.EXCEDIDO) && d.gt(UMBRALES_PRESUPUESTO.EXCEDIDO)) return UMBRALES_PRESUPUESTO.EXCEDIDO;
  if (a.lt(UMBRALES_PRESUPUESTO.ALERTA) && d.gte(UMBRALES_PRESUPUESTO.ALERTA) && d.lte(UMBRALES_PRESUPUESTO.EXCEDIDO)) {
    return UMBRALES_PRESUPUESTO.ALERTA;
  }
  return null;
}
