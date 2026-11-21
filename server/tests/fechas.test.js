import {
  dateATexto,
  hoy,
  limitesDelMes,
  mesAnterior,
  mesSiguiente,
  periodoActual,
  textoADate,
} from '../src/utils/fechas.js';

describe('utilidades de fechas (Day.js)', () => {
  it('calcula hoy y el mes en curso según APP_TIMEZONE', () => {
    const instante = new Date('2026-12-01T03:00:00Z'); // 22:00 del 30/11 en Lima
    expect(hoy('America/Lima', instante)).toBe('2026-11-30');
    expect(periodoActual('America/Lima', instante)).toBe('2026-11');
    expect(hoy('UTC', instante)).toBe('2026-12-01');
    expect(periodoActual('UTC', instante)).toBe('2026-12');
  });

  it('guarda un día calendario a las 00:00 UTC y lo devuelve sin desfase', () => {
    const fecha = textoADate('2026-08-15');
    expect(fecha.toISOString()).toBe('2026-08-15T00:00:00.000Z');
    expect(dateATexto(fecha)).toBe('2026-08-15');
  });

  it('obtiene los límites de un mes, incluidos febrero bisiesto y diciembre', () => {
    expect(limitesDelMes('2026-08')).toMatchObject({ desde: '2026-08-01', hasta: '2026-08-31' });
    expect(limitesDelMes('2026-02').hasta).toBe('2026-02-28');
    expect(limitesDelMes('2028-02').hasta).toBe('2028-02-29');
    const dic = limitesDelMes('2026-12');
    expect(dic.hasta).toBe('2026-12-31');
    expect(dic.finExclusivo.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('un movimiento del último día queda dentro de su mes y no del siguiente', () => {
    const { inicio, finExclusivo } = limitesDelMes('2026-08');
    const ultimo = textoADate('2026-08-31');
    expect(ultimo >= inicio && ultimo < finExclusivo).toBe(true);
    expect(textoADate('2026-09-01') < finExclusivo).toBe(false);
  });

  it('avanza y retrocede meses cruzando el año', () => {
    expect(mesSiguiente('2026-12')).toBe('2027-01');
    expect(mesAnterior('2027-01')).toBe('2026-12');
    expect(mesSiguiente('2026-01')).toBe('2026-02');
  });
});
