import mongoose from 'mongoose';
import { aDecimal128, comparar, montoATexto, porcentaje, restar, sumar } from '../src/utils/dinero.js';

describe('utilidades de dinero (Decimal128 + decimal.js)', () => {
  it('convierte a Decimal128 con 2 decimales y vuelve a texto', () => {
    const d = aDecimal128('150.5');
    expect(d).toBeInstanceOf(mongoose.Types.Decimal128);
    expect(d.toString()).toBe('150.50');
    expect(montoATexto(d)).toBe('150.50');
    expect(montoATexto(0)).toBe('0.00');
  });

  it('redondea half-up a 2 decimales', () => {
    expect(montoATexto('1.005')).toBe('1.01');
    expect(montoATexto('1.004')).toBe('1.00');
    expect(montoATexto('2.675')).toBe('2.68'); // con Number daría 2.67
  });

  it('suma sin errores de coma flotante', () => {
    expect(sumar('0.1', '0.2').toFixed(2)).toBe('0.30');
    expect(0.1 + 0.2).not.toBe(0.3); // el problema que evitamos
    expect(sumar(aDecimal128('10.10'), aDecimal128('20.20'), '0.01').toFixed(2)).toBe('30.31');
  });

  it('resta y compara respetando el signo', () => {
    expect(restar('100.00', '250.75').toFixed(2)).toBe('-150.75');
    expect(comparar('10.00', '9.99')).toBe(1);
    expect(comparar('10.00', aDecimal128('10'))).toBe(0);
  });

  it('calcula porcentajes con 2 decimales y soporta total cero', () => {
    expect(porcentaje('1350', '1500').toFixed(2)).toBe('90.00');
    expect(porcentaje('1', '3').toFixed(2)).toBe('33.33');
    expect(porcentaje('1725', '1500').toFixed(2)).toBe('115.00');
    expect(porcentaje('10', '0').toFixed(2)).toBe('0.00');
  });

  it('maneja el máximo permitido sin perder precisión', () => {
    expect(montoATexto('999999999.99')).toBe('999999999.99');
    expect(sumar('999999999.99', '0.01').toFixed(2)).toBe('1000000000.00');
  });
});
