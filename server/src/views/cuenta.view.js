// Representación JSON de una cuenta. Los saldos salen como texto con dos decimales, nunca como número.
import Decimal from 'decimal.js';

export const importeTexto = (valor) => new Decimal(String(valor)).toFixed(2);

export function cuentaJson(cuenta) {
  return {
    id: String(cuenta.id ?? cuenta._id),
    nombre: cuenta.nombre,
    tipo: cuenta.tipo,
    moneda: cuenta.moneda,
    saldoInicial: importeTexto(cuenta.saldoInicial),
    saldoActual: importeTexto(cuenta.saldoActual),
    creadaEn: cuenta.createdAt,
    actualizadaEn: cuenta.updatedAt,
  };
}
