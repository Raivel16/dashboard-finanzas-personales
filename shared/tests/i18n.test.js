import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_PREDETERMINADAS,
  IDIOMAS,
  MENSAJES,
  MENSAJES_EN,
  categoriasPredeterminadas,
  crearTraductor,
  crearEsquemaMovimiento,
  esquemaPreferencias,
  esquemaRegistro,
  idiomaDe,
  traducirMensaje,
  validar,
} from '../src/index.js';

/** Lista las rutas de un catálogo con el tipo de cada hoja ("string" o "function"). */
function forma(objeto, prefijo = '') {
  return Object.entries(objeto).flatMap(([clave, valor]) =>
    valor && typeof valor === 'object'
      ? forma(valor, `${prefijo}${clave}.`)
      : [`${prefijo}${clave}:${typeof valor}${typeof valor === 'function' ? valor.length : ''}`],
  );
}

describe('catálogo en inglés (HU-32)', () => {
  it('tiene exactamente la misma forma que el catálogo en español', () => {
    expect(forma(MENSAJES_EN)).toEqual(forma(MENSAJES));
  });

  it('no deja ningún texto igual al español ni vacío', () => {
    const textos = (o) => Object.values(o).flatMap((v) => (typeof v === 'object' ? textos(v) : [v]));
    const es = textos(MENSAJES);
    textos(MENSAJES_EN).forEach((en, i) => {
      if (typeof en === 'string') {
        expect(en).not.toBe('');
        expect(en).not.toBe(es[i]);
      }
    });
  });

  it('crea las categorías predeterminadas en el idioma de registro', () => {
    expect(categoriasPredeterminadas()).toBe(CATEGORIAS_PREDETERMINADAS);
    const en = categoriasPredeterminadas(IDIOMAS.EN);
    expect(en.map((c) => c.nombre)).toEqual([
      'Food',
      'Transport',
      'Housing',
      'Health',
      'Entertainment',
      'Education',
      'Other expenses',
      'Salary',
      'Sales',
      'Other income',
    ]);
    expect(en.map((c) => [c.tipo, c.icono])).toEqual(
      CATEGORIAS_PREDETERMINADAS.map((c) => [c.tipo, c.icono]),
    );
  });
});

describe('traductor por texto (HU-32)', () => {
  it('traduce los textos fijos y deja el español sin cambios', () => {
    expect(traducirMensaje(MENSAJES.monto.positivo, 'en')).toBe(
      'The amount must be greater than 0, with up to 2 decimals',
    );
    expect(traducirMensaje(MENSAJES.monto.positivo, 'es')).toBe(MENSAJES.monto.positivo);
  });

  it('traduce las plantillas y también los valores que llevan dentro', () => {
    expect(traducirMensaje(MENSAJES.reporte.supera(5000), 'en')).toBe(MENSAJES_EN.reporte.supera(5000));
    expect(traducirMensaje(MENSAJES.generales.requerido('El nombre'), 'en')).toBe('The name is required');
    expect(traducirMensaje(MENSAJES.generales.requerida('La contraseña'), 'en')).toBe('The password is required');
    expect(traducirMensaje(MENSAJES.auth.bloqueado(1), 'en')).toBe(MENSAJES_EN.auth.bloqueado(1));
    expect(traducirMensaje(MENSAJES.auth.bloqueado(15), 'en')).toBe(MENSAJES_EN.auth.bloqueado(15));
    expect(traducirMensaje(MENSAJES.presupuesto.alertaCategoria(90, 'Comida rápida'), 'en')).toBe(
      'You have used 90% of the Comida rápida budget',
    );
    // Un nombre propio que coincide con una etiqueta de la interfaz no se traduce.
    const t = crearTraductor([[null, { Saldo: 'Balance' }], ...[[MENSAJES, MENSAJES_EN]]]);
    expect(t(MENSAJES.presupuesto.alertaExcedidoCategoria('Saldo'), 'en')).toBe(
      'You exceeded the Saldo budget',
    );
  });

  it('devuelve tal cual un texto sin traducción y nunca uno vacío', () => {
    expect(traducirMensaje('Mi categoría propia', 'en')).toBe('Mi categoría propia');
    expect(traducirMensaje('', 'en')).toBe('');
    expect(traducirMensaje(undefined, 'en')).toBeUndefined();
  });

  it('suma diccionarios planos con prioridad para el último', () => {
    const t = crearTraductor([
      [{ a: 'Hola' }, { a: 'Hello' }],
      [null, { Hola: 'Hi' }],
    ]);
    expect(t('Hola', 'en')).toBe('Hi');
  });

  it('traduce los errores de validación de un movimiento (Escenario 3)', () => {
    const { errores } = validar(crearEsquemaMovimiento(), { tipo: 'gasto', monto: '0', fecha: '2026-01-01' });
    const monto = errores.find((e) => e.campo === 'monto');
    expect(traducirMensaje(monto.mensaje, 'en')).toBe(
      'The amount must be greater than 0, with up to 2 decimals',
    );
  });

  it('obtiene el idioma de Accept-Language o del navegador', () => {
    expect(idiomaDe('en-US,en;q=0.9')).toBe('en');
    expect(idiomaDe('es-PE,en;q=0.8')).toBe('es');
    expect(idiomaDe(undefined)).toBe('es');
  });
});

describe('esquemas de preferencias (HU-32, HU-33)', () => {
  it('registra en español por defecto y valida el idioma', () => {
    const base = { nombre: 'Ana', email: 'ana@correo.com', password: 'Segura123' };
    expect(validar(esquemaRegistro, base).datos.idioma).toBe('es');
    expect(validar(esquemaRegistro, { ...base, idioma: 'en' }).datos.idioma).toBe('en');
    expect(validar(esquemaRegistro, { ...base, idioma: 'fr' }).errores).toEqual([
      { campo: 'idioma', mensaje: MENSAJES.idioma },
    ]);
  });

  it('convierte las preferencias de accesibilidad a booleanos', () => {
    const r = validar(esquemaPreferencias, { textoGrande: true, altoContraste: 'false' });
    expect(r.datos).toEqual({ textoGrande: true, altoContraste: false });
    expect(validar(esquemaPreferencias, { textoGrande: 'si' }).valido).toBe(false);
  });
});
