// Formato de montos y fechas. El servidor entrega los montos como texto con 2 decimales ("1250.50").
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { obtenerIdioma } from '../preferencias/preferencias.js';

const SIGNO_MENOS = '−'; // − (no el guion)

const SIMBOLOS_MONEDA = { PEN: 'S/', USD: '$', EUR: '€' };

/** "1250.5" + "PEN" -> "S/ 1,250.50". Siempre con 2 decimales y con el símbolo de su moneda ("$" para USD). */
export function formatearMonto(valor, moneda) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '';
  const cifra = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(numero));
  return `${SIMBOLOS_MONEDA[moneda] ?? moneda} ${cifra}`;
}

/** Saldo con su signo: un saldo negativo (p. ej. deuda de una tarjeta) lleva "−" delante. */
export function formatearSaldo(valor, moneda) {
  const texto = formatearMonto(valor, moneda);
  return Number(valor) < 0 ? `${SIGNO_MENOS}${texto}` : texto;
}

/** Signo visible de un movimiento: nunca se comunica solo con color. */
export function signoDe(tipo) {
  if (tipo === 'ingreso') return '+';
  if (tipo === 'gasto') return SIGNO_MENOS;
  return '';
}

/** "2026-08-15" -> "15 ago 2026" (en inglés, "15 Aug 2026"). */
export function formatearFecha(texto) {
  return dayjs(texto).locale(obtenerIdioma()).format('D MMM YYYY');
}
