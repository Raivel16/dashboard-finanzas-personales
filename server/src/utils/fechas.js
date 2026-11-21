// Fechas: un día calendario se guarda como Date a las 00:00 UTC y viaja como YYYY-MM-DD.
// "Hoy" y el mes en curso se calculan en la zona horaria de referencia (APP_TIMEZONE).
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { ZONA_HORARIA_POR_DEFECTO } from '@finanzas/shared';

dayjs.extend(utc);
dayjs.extend(timezone);

export const hoy = (zona = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) =>
  dayjs(ahora).tz(zona).format('YYYY-MM-DD');

export const periodoActual = (zona = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) =>
  dayjs(ahora).tz(zona).format('YYYY-MM');

/** "2026-08-15" -> Date 2026-08-15T00:00:00.000Z */
export const textoADate = (texto) => new Date(`${texto}T00:00:00.000Z`);

/** Date -> "2026-08-15" (en UTC, igual que se guardó). */
export const dateATexto = (fecha) => dayjs.utc(fecha).format('YYYY-MM-DD');

/** Límites de un período "YYYY-MM": primer y último día, y el inicio del mes siguiente. */
export function limitesDelMes(periodo) {
  const inicio = dayjs.utc(`${periodo}-01`);
  const fin = inicio.endOf('month');
  return {
    desde: inicio.format('YYYY-MM-DD'),
    hasta: fin.format('YYYY-MM-DD'),
    inicio: inicio.toDate(),
    finExclusivo: inicio.add(1, 'month').toDate(),
  };
}

export const mesSiguiente = (periodo) => dayjs.utc(`${periodo}-01`).add(1, 'month').format('YYYY-MM');
export const mesAnterior = (periodo) => dayjs.utc(`${periodo}-01`).subtract(1, 'month').format('YYYY-MM');
