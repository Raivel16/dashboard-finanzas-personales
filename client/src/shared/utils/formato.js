// Formato de montos y fechas. El servidor entrega los montos como texto con 2 decimales ("1250.50").
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const SIGNO_MENOS = '−'; // − (no el guion)

/** "1250.5" + "PEN" -> "S/ 1,250.50". Siempre con 2 decimales y con el símbolo de su moneda. */
export function formatearMonto(valor, moneda) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(Math.abs(numero))
    .replaceAll(String.fromCharCode(160), ' ');
}

/** Signo visible de un movimiento: nunca se comunica solo con color. */
export function signoDe(tipo) {
  if (tipo === 'ingreso') return '+';
  if (tipo === 'gasto') return SIGNO_MENOS;
  return '';
}

/** "2026-08-15" -> "15 ago 2026" */
export function formatearFecha(texto) {
  return dayjs(texto).format('D MMM YYYY');
}
