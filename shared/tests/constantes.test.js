import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_PREDETERMINADAS,
  CODIGOS_ERROR,
  MONEDAS,
  ROLES,
  TIPOS_CUENTA,
  TIPOS_MOVIMIENTO,
  MENSAJES,
} from '../src/index.js';

describe('constantes compartidas', () => {
  it('define los roles, tipos y monedas del proyecto', () => {
    expect(Object.values(ROLES)).toEqual(['usuario', 'admin']);
    expect(Object.values(TIPOS_MOVIMIENTO)).toEqual(['ingreso', 'gasto']);
    expect(Object.values(TIPOS_CUENTA)).toEqual([
      'efectivo',
      'banco',
      'tarjeta_credito',
      'billetera_digital',
    ]);
    expect(MONEDAS).toEqual(['PEN', 'USD', 'EUR']);
  });

  it('define las categorías predeterminadas de HU-24 sin repetir nombres por tipo', () => {
    const gastos = CATEGORIAS_PREDETERMINADAS.filter((c) => c.tipo === 'gasto').map((c) => c.nombre);
    const ingresos = CATEGORIAS_PREDETERMINADAS.filter((c) => c.tipo === 'ingreso').map((c) => c.nombre);
    expect(gastos).toEqual([
      'Alimentación',
      'Transporte',
      'Vivienda',
      'Salud',
      'Entretenimiento',
      'Educación',
      'Otros gastos',
    ]);
    expect(ingresos).toEqual(['Sueldo', 'Ventas', 'Otros ingresos']);
  });

  it('expone los códigos de error de la API y mensajes en español', () => {
    expect(CODIGOS_ERROR.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(MENSAJES.generales.noExiste).toContain('no existe');
    expect(MENSAJES.generales.requerido('El monto')).toBe('El monto es obligatorio');
  });
});
