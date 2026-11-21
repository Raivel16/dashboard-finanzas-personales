import { describe, expect, it } from 'vitest';
import {
  crearEsquemaMovimiento,
  esquemaCategoria,
  esquemaConsultaMovimientos,
  esquemaCuenta,
  esquemaInicioSesion,
  esquemaPaginacion,
  esquemaPresupuesto,
  esquemaOlvideContrasena,
  esquemaRegistro,
  esquemaRestablecerContrasena,
  fechaHoy,
  normalizarMonto,
  validar,
} from '../src/index.js';

const ID = '64b7f0c2a1b2c3d4e5f60718';
const campos = (r) => r.errores.map((e) => e.campo);

describe('validar', () => {
  it('devuelve los datos saneados cuando todo es válido', () => {
    const r = validar(esquemaRegistro, {
      nombre: '  Ana  ',
      email: ' ANA@Correo.com ',
      password: 'Clave1234',
    });
    expect(r.valido).toBe(true);
    expect(r.datos).toEqual({ nombre: 'Ana', email: 'ana@correo.com', password: 'Clave1234' });
  });

  it('informa un error por cada campo inválido', () => {
    const r = validar(esquemaRegistro, { nombre: 'A', email: 'no-es-correo', password: 'corta' });
    expect(r.valido).toBe(false);
    expect(campos(r)).toEqual(['nombre', 'email', 'password']);
  });

  it('rechaza objetos y arreglos donde se espera un valor simple', () => {
    const r = validar(esquemaRegistro, { nombre: { $ne: '' }, email: ['a@b.com'], password: 'Clave1234' });
    expect(campos(r)).toEqual(['nombre', 'email']);
  });

  it('tolera una entrada vacía o nula', () => {
    expect(validar(esquemaRegistro, null).errores).toHaveLength(3);
    expect(validar(esquemaRegistro).valido).toBe(false);
  });
});

describe('registro e inicio de sesión', () => {
  it('exige nombre de 2 a 80 caracteres', () => {
    const base = { email: 'a@b.com', password: 'Clave1234' };
    expect(validar(esquemaRegistro, { ...base, nombre: 'Al' }).valido).toBe(true);
    expect(validar(esquemaRegistro, { ...base, nombre: 'x'.repeat(80) }).valido).toBe(true);
    expect(validar(esquemaRegistro, { ...base, nombre: 'x'.repeat(81) }).valido).toBe(false);
    expect(validar(esquemaRegistro, { ...base, nombre: '' }).errores[0].mensaje).toBe(
      'El nombre es obligatorio',
    );
  });

  it('exige una contraseña de 8 a 72 bytes con una mayúscula y un número', () => {
    const base = { nombre: 'Ana', email: 'a@b.com' };
    const probar = (password) => validar(esquemaRegistro, { ...base, password }).valido;
    expect(probar('Clave1234')).toBe(true);
    expect(probar('clave1234')).toBe(false); // sin mayúscula
    expect(probar('ClaveSinNumero')).toBe(false);
    expect(probar('Cl4ve')).toBe(false); // corta
    expect(probar(`A1${'x'.repeat(70)}`)).toBe(true); // 72
    expect(probar(`A1${'x'.repeat(71)}`)).toBe(false); // 73
  });

  it('el inicio de sesión solo exige correo válido y contraseña presente', () => {
    expect(validar(esquemaInicioSesion, { email: 'a@b.com', password: 'cualquiera' }).valido).toBe(true);
    expect(campos(validar(esquemaInicioSesion, { email: 'a@b', password: '' }))).toEqual([
      'email',
      'password',
    ]);
  });
});

describe('cuentas y categorías', () => {
  it('valida una cuenta y aplica saldo inicial cero por defecto', () => {
    const r = validar(esquemaCuenta, { nombre: 'Efectivo', tipo: 'efectivo', moneda: 'pen' });
    expect(r.valido).toBe(true);
    expect(r.datos).toEqual({ nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '0.00' });
  });

  it('acepta saldo inicial negativo y rechaza más de 2 decimales o valores enormes', () => {
    const base = { nombre: 'Visa', tipo: 'tarjeta_credito', moneda: 'USD' };
    expect(validar(esquemaCuenta, { ...base, saldoInicial: '-120.5' }).datos.saldoInicial).toBe('-120.50');
    expect(validar(esquemaCuenta, { ...base, saldoInicial: '10.123' }).valido).toBe(false);
    expect(validar(esquemaCuenta, { ...base, saldoInicial: '1000000000' }).valido).toBe(false);
    expect(validar(esquemaCuenta, { ...base, saldoInicial: 'abc' }).valido).toBe(false);
  });

  it('exige moneda y tipo válidos', () => {
    const r = validar(esquemaCuenta, { nombre: 'X1', tipo: 'otro', moneda: '' });
    expect(campos(r)).toEqual(['tipo', 'moneda']);
    expect(r.errores[1].mensaje).toBe('Selecciona una moneda válida');
    expect(validar(esquemaCuenta, { nombre: 'X1', tipo: 'banco', moneda: 'GBP' }).valido).toBe(false);
  });

  it('exige nombre de 2 a 50 caracteres en cuentas y categorías', () => {
    expect(validar(esquemaCategoria, { nombre: 'x'.repeat(51), tipo: 'gasto' }).valido).toBe(false);
    expect(validar(esquemaCategoria, { nombre: 'Café', tipo: 'gasto' }).valido).toBe(true);
    expect(validar(esquemaCategoria, { nombre: 'Café', tipo: 'otro' }).valido).toBe(false);
  });
});

describe('movimientos', () => {
  const esquema = crearEsquemaMovimiento({ hoy: '2026-11-18' });
  const valido = { tipo: 'gasto', monto: '45.5', fecha: '2026-11-18', categoriaId: ID, cuentaId: ID };

  it('acepta un movimiento válido y normaliza el monto a 2 decimales', () => {
    const r = validar(esquema, { ...valido, descripcion: ' Almuerzo ' });
    expect(r.valido).toBe(true);
    expect(r.datos.monto).toBe('45.50');
    expect(r.datos.descripcion).toBe('Almuerzo');
  });

  it('rechaza monto cero, negativo, con más de 2 decimales o mayor al máximo', () => {
    for (const monto of ['0', '-5', '10.999', '1000000000', 'abc']) {
      expect(validar(esquema, { ...valido, monto }).valido, monto).toBe(false);
    }
    expect(validar(esquema, { ...valido, monto: '999999999.99' }).valido).toBe(true);
  });

  it('reporta monto 0 y fecha ausente a la vez (escenario de contrato-api)', () => {
    const r = validar(esquema, { ...valido, monto: '0', fecha: '' });
    expect(campos(r)).toEqual(['monto', 'fecha']);
  });

  it('rechaza fechas con formato inválido, inexistentes y futuras', () => {
    expect(validar(esquema, { ...valido, fecha: '18-11-2026' }).errores[0].mensaje).toContain('AAAA-MM-DD');
    expect(validar(esquema, { ...valido, fecha: '2026-02-30' }).valido).toBe(false);
    expect(validar(esquema, { ...valido, fecha: '2026-11-19' }).errores[0].mensaje).toBe(
      'La fecha no puede ser futura',
    );
    expect(validar(esquema, { ...valido, fecha: '2026-11-17' }).valido).toBe(true);
  });

  it('limita la descripción a 255 caracteres y valida los identificadores', () => {
    expect(validar(esquema, { ...valido, descripcion: 'x'.repeat(256) }).valido).toBe(false);
    expect(validar(esquema, { ...valido, descripcion: 'x'.repeat(255) }).valido).toBe(true);
    expect(campos(validar(esquema, { ...valido, categoriaId: '1', cuentaId: '' }))).toEqual([
      'categoriaId',
      'cuentaId',
    ]);
  });

  it('calcula "hoy" según la zona horaria', () => {
    const instante = new Date('2026-11-18T02:30:00Z'); // 21:30 del 17/11 en Lima
    expect(fechaHoy('America/Lima', instante)).toBe('2026-11-17');
    expect(fechaHoy('UTC', instante)).toBe('2026-11-18');
  });
});

describe('presupuestos', () => {
  it('valida período AAAA-MM, moneda y monto; la categoría es opcional', () => {
    const r = validar(esquemaPresupuesto, { periodo: '2026-11', moneda: 'EUR', monto: '1500' });
    expect(r.valido).toBe(true);
    expect(r.datos).toEqual({ periodo: '2026-11', moneda: 'EUR', monto: '1500.00' });
    expect(campos(validar(esquemaPresupuesto, { periodo: '2026-13', moneda: 'EUR', monto: '0' }))).toEqual([
      'periodo',
      'monto',
    ]);
    expect(
      validar(esquemaPresupuesto, { periodo: '2026-11', moneda: 'EUR', monto: '5', categoriaId: ID }).valido,
    ).toBe(true);
  });
});

describe('paginación, orden y filtros', () => {
  it('aplica los valores por defecto cuando no hay parámetros', () => {
    expect(validar(esquemaConsultaMovimientos, {}).datos).toEqual({ page: 1, limit: 20, sort: '-fecha' });
  });

  it('convierte page y limit desde texto', () => {
    expect(validar(esquemaPaginacion, { page: '3', limit: '50' }).datos).toEqual({ page: 3, limit: 50 });
  });

  it('rechaza limit superior a 100 indicando el máximo', () => {
    const r = validar(esquemaPaginacion, { limit: '500' });
    expect(r.valido).toBe(false);
    expect(r.errores[0].campo).toBe('limit');
    expect(r.errores[0].mensaje).toContain('100');
  });

  it('rechaza page y limit que no son enteros positivos', () => {
    for (const v of ['0', '-1', '1.5', 'x']) {
      expect(validar(esquemaPaginacion, { page: v }).valido, v).toBe(false);
      expect(validar(esquemaPaginacion, { limit: v }).valido, v).toBe(false);
    }
  });

  it('acepta filtros combinados y orden permitido', () => {
    const r = validar(esquemaConsultaMovimientos, {
      desde: '2026-08-01',
      hasta: '2026-08-31',
      tipo: 'gasto',
      sort: '-fecha',
      moneda: 'pen',
    });
    expect(r.valido).toBe(true);
    expect(r.datos).toMatchObject({
      desde: '2026-08-01',
      hasta: '2026-08-31',
      tipo: 'gasto',
      moneda: 'PEN',
      sort: '-fecha',
    });
  });

  it('rechaza una fecha de filtro con formato inválido señalando el parámetro', () => {
    const r = validar(esquemaConsultaMovimientos, { desde: '31-08-2026' });
    expect(r.valido).toBe(false);
    expect(r.errores).toEqual([{ campo: 'desde', mensaje: 'La fecha debe tener el formato AAAA-MM-DD' }]);
  });

  it('rechaza un rango invertido y un orden no permitido', () => {
    expect(
      validar(esquemaConsultaMovimientos, { desde: '2026-09-01', hasta: '2026-08-01' }).errores[0].campo,
    ).toBe('hasta');
    expect(validar(esquemaConsultaMovimientos, { sort: 'passwordHash' }).errores[0].campo).toBe('sort');
  });
});

describe('normalizarMonto', () => {
  it.each([
    ['15', '15.00'],
    ['15.5', '15.50'],
    ['007.10', '7.10'],
    ['-0', '0.00'],
    ['-3.2', '-3.20'],
    ['+4', '4.00'],
  ])('%s -> %s', (entrada, salida) => {
    expect(normalizarMonto(entrada)).toBe(salida);
  });
});

describe('autenticación: mensajes y esquemas de recuperación', () => {
  const base = { nombre: 'Ana', email: 'a@b.com' };

  it('usa el mensaje exacto de la spec para una contraseña insegura', () => {
    const r = validar(esquemaRegistro, { ...base, password: 'abc' });
    expect(r.errores).toEqual([
      {
        campo: 'password',
        mensaje: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número',
      },
    ]);
  });

  it('distingue una contraseña demasiado larga para bcrypt (72 bytes)', () => {
    const r = validar(esquemaRegistro, { ...base, password: `A1${'x'.repeat(71)}` });
    expect(r.errores[0].mensaje).toBe('La contraseña no puede superar 72 caracteres');
  });

  it('valida el correo de olvidé mi contraseña', () => {
    expect(validar(esquemaOlvideContrasena, { email: ' Ana@Correo.com ' }).datos).toEqual({
      email: 'ana@correo.com',
    });
    expect(validar(esquemaOlvideContrasena, { email: 'no' }).valido).toBe(false);
  });

  it('exige el enlace y una contraseña válida al restablecer', () => {
    expect(validar(esquemaRestablecerContrasena, { token: 'abc', password: 'Clave1234' }).valido).toBe(true);
    const r = validar(esquemaRestablecerContrasena, { token: '', password: 'floja' });
    expect(campos(r)).toEqual(['token', 'password']);
  });
});
