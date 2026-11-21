// Montos: se guardan como Decimal128 y se calculan con decimal.js, nunca con Number.
import Decimal from 'decimal.js';
import mongoose from 'mongoose';

const DecimalMonto = Decimal.clone({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

const aDecimal = (valor) => new DecimalMonto(valor?.toString?.() ?? valor);

/** Convierte un monto (texto, número o Decimal128) a Decimal128 con 2 decimales. */
export function aDecimal128(valor) {
  return mongoose.Types.Decimal128.fromString(aDecimal(valor).toDecimalPlaces(2).toFixed(2));
}

/** Convierte un monto (Decimal128, texto o número) al texto con 2 decimales que viaja en el JSON. */
export function montoATexto(valor) {
  return aDecimal(valor).toDecimalPlaces(2).toFixed(2);
}

export const sumar = (...valores) =>
  valores.reduce((total, v) => total.plus(aDecimal(v)), new DecimalMonto(0));
export const restar = (a, b) => aDecimal(a).minus(aDecimal(b));
export const comparar = (a, b) => aDecimal(a).comparedTo(aDecimal(b));

/** Porcentaje de `parte` sobre `total` redondeado a 2 decimales (0 si el total es cero). */
export function porcentaje(parte, total) {
  const t = aDecimal(total);
  if (t.isZero()) return new DecimalMonto(0);
  return aDecimal(parte).div(t).times(100).toDecimalPlaces(2);
}
