// HU-32 · Elegir el idioma de la aplicación y HU-33 · Usar la aplicación de forma accesible (preferencias-usuario).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { llamadasA, montarApp, respuestaApi, simularFetch, USUARIO_PRUEBA } from './ayudas.jsx';
import { simularIdiomaNavegador } from './setup.js';
import { reiniciarPreferencias } from '../src/shared/preferencias/preferencias.js';
import { traducir } from '../src/shared/preferencias/traducir.js';
import { TEXTOS_EN } from '../src/shared/preferencias/textos.en.js';
import { COLORES_ALTO_CONTRASTE } from '../src/shared/utils/tokens.js';
import { ETIQUETAS_ICONO } from '../src/categorias/iconos.js';
import { ETIQUETAS_TIPO_CUENTA } from '../src/cuentas/etiquetas.js';
import { ETIQUETAS_ROL } from '../src/administracion/etiquetas.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const raiz = () => document.documentElement;
const cuerpoDe = (llamada) => JSON.parse(llamada[1].body);
const idiomaEnviado = (llamada) => llamada[1].headers['Accept-Language'];

const CUENTA = {
  id: '65f0000000000000000000a1',
  nombre: 'Efectivo',
  tipo: 'efectivo',
  moneda: 'PEN',
  saldoInicial: '500.00',
  saldoActual: '500.00',
};
const CATEGORIA = {
  id: '65f000000000000000000001',
  nombre: 'Alimentación',
  tipo: 'gasto',
  icono: 'utensils',
};
const lista = (items) =>
  respuestaApi(200, { data: items, meta: { page: 1, limit: 100, total: items.length, totalPages: 1 } });

/** Servidor simulado con una cuenta, una categoría y el perfil que guarda las preferencias. */
function simularServidor({ sesion = USUARIO_PRUEBA, movimientos = [], rutas = {} } = {}) {
  let usuario = sesion && { idioma: 'es', textoGrande: false, altoContraste: false, ...sesion };
  return simularFetch(undefined, {
    sesion: usuario,
    rutas: {
      '/cuentas': async () => lista([CUENTA]),
      '/categorias': async () => lista([CATEGORIA]),
      '/movimientos': async (opciones) => {
        if (opciones?.method === 'POST') {
          const nuevo = { id: 'n1', moneda: 'PEN', saldoResultante: '475.00', ...JSON.parse(opciones.body) };
          movimientos = [nuevo, ...movimientos];
          return respuestaApi(201, { data: nuevo });
        }
        return lista(movimientos);
      },
      '/perfil/preferencias': async (opciones) => {
        usuario = { ...usuario, ...JSON.parse(opciones.body) };
        return respuestaApi(200, { data: usuario });
      },
      ...rutas,
    },
  });
}

describe('HU-32 · idioma', () => {
  it('Cambio del idioma a inglés: toda la interfaz cambia de inmediato, sin recargar, y se guarda en el perfil', async () => {
    const fetchSimulado = simularServidor();
    await montarApp({ ruta: '/perfil', escritorio: true });
    const usuario = userEvent.setup();
    expect(raiz().lang).toBe('es');

    // Un dato a medio escribir sobrevive al cambio: no hay recarga ni se pierde el estado.
    const nombre = screen.getByLabelText('Nombre');
    await usuario.clear(nombre);
    await usuario.type(nombre, 'Ana María');

    await usuario.selectOptions(screen.getByRole('combobox', { name: 'Idioma / Language' }), 'en');

    expect(await screen.findByRole('heading', { name: 'My profile', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Language and accessibility' })).toBeInTheDocument();
    expect(
      within(screen.getAllByRole('navigation', { name: 'Main' })[0]).getByRole('link', { name: 'Movements' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Ana María');
    expect(raiz().lang).toBe('en');

    await waitFor(() => expect(llamadasA(fetchSimulado, '/perfil/preferencias')).toHaveLength(1));
    expect(cuerpoDe(llamadasA(fetchSimulado, '/perfil/preferencias')[0])).toEqual({ idioma: 'en' });
  });

  it('Cambio del idioma a inglés: se conserva al volver a iniciar sesión (lo trae el perfil)', async () => {
    simularServidor({ sesion: { ...USUARIO_PRUEBA, idioma: 'en' } });
    await montarApp({ ruta: '/movimientos', escritorio: true });
    expect(await screen.findByRole('heading', { name: 'Movements', level: 1 })).toBeInTheDocument();
    expect(raiz().lang).toBe('en');
  });

  it('Idioma antes de iniciar sesión: un navegador en inglés ve la pantalla en inglés y puede cambiar a español', async () => {
    simularIdiomaNavegador('en-US');
    reiniciarPreferencias();
    const fetchSimulado = simularServidor({ sesion: null });
    await montarApp({ ruta: '/iniciar-sesion' });
    const usuario = userEvent.setup();

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(raiz().lang).toBe('en');
    expect(idiomaEnviado(llamadasA(fetchSimulado, '/auth/me')[0])).toBe('en');

    await usuario.selectOptions(screen.getByRole('combobox', { name: 'Idioma / Language' }), 'es');
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(raiz().lang).toBe('es');
    // Sin sesión la elección se recuerda en el navegador.
    expect(JSON.parse(window.localStorage.getItem('finanzas.preferencias')).idioma).toBe('es');
  });

  it('Mensajes de error en el idioma elegido: un monto 0 muestra el mensaje de validación en inglés', async () => {
    const fetchSimulado = simularServidor({ sesion: { ...USUARIO_PRUEBA, idioma: 'en' } });
    await montarApp({ ruta: '/movimientos', escritorio: true });
    const usuario = userEvent.setup();

    await usuario.click(await screen.findByRole('button', { name: 'New movement' }));
    const dialogo = await screen.findByRole('dialog', { name: 'New movement' });
    await usuario.type(within(dialogo).getByLabelText('Amount'), '0');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Record movement' }));

    expect(
      within(dialogo).getByText('The amount must be greater than 0, with up to 2 decimals'),
    ).toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/movimientos').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });

  it('Mensajes de error en el idioma elegido: los mensajes de la API se piden en el idioma vigente', async () => {
    const fetchSimulado = simularServidor({ sesion: { ...USUARIO_PRUEBA, idioma: 'en' } });
    await montarApp({ ruta: '/movimientos', escritorio: true });
    await screen.findByRole('button', { name: 'New movement' });
    const llamadas = llamadasA(fetchSimulado, '/movimientos');
    expect(idiomaEnviado(llamadas.at(-1))).toBe('en');
  });

  it('Correos y reportes en el idioma elegido: la exportación se pide en inglés y sus botones están en inglés', async () => {
    const descarga = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'attachment; filename="movimientos-2026-01.pdf"' },
      blob: async () => new Blob(['%PDF-']),
    }));
    const fetchSimulado = simularServidor({
      sesion: { ...USUARIO_PRUEBA, idioma: 'en' },
      movimientos: [
        {
          id: 'm1',
          tipo: 'gasto',
          monto: '20.00',
          moneda: 'PEN',
          fecha: '2026-01-10',
          categoriaId: CATEGORIA.id,
          cuentaId: CUENTA.id,
          descripcion: '',
          saldoResultante: '480.00',
        },
      ],
      rutas: { '/reportes/movimientos.pdf': descarga },
    });
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: () => {} });
    await montarApp({ ruta: '/movimientos', escritorio: true });
    const usuario = userEvent.setup();

    const boton = await screen.findByRole('button', { name: 'Export to PDF' });
    await waitFor(() => expect(boton).toBeEnabled());
    await usuario.click(boton);
    await waitFor(() => expect(descarga).toHaveBeenCalled());
    expect(idiomaEnviado(llamadasA(fetchSimulado, '/reportes/movimientos.pdf')[0])).toBe('en');
  });

  it('cada texto de las pantallas tiene traducción al inglés', () => {
    const archivos = [];
    const recorrer = (carpeta) =>
      readdirSync(carpeta).forEach((nombre) => {
        const ruta = join(carpeta, nombre);
        if (statSync(ruta).isDirectory()) recorrer(ruta);
        else if (/\.(js|jsx)$/.test(nombre) && !nombre.endsWith('.en.js')) archivos.push(ruta);
      });
    recorrer(resolve(process.cwd(), 'src'));

    // Textos que pasan por el traductor: t('…'), traducir('…'), notificar.x('…') y los campos que se traducen al
    // mostrarse (títulos y etiquetas de rutas, diálogos de confirmación).
    const patron =
      /(?:\bt|\btraducir|notificar\.\w+)\(\s*'((?:[^'\\]|\\.)+)'|\b(?:titulo|texto|confirmar|etiqueta):\s*'((?:[^'\\]|\\.)+)'/g;
    const textos = new Set();
    for (const archivo of archivos) {
      const codigo = readFileSync(archivo, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const m of codigo.matchAll(patron)) textos.add((m[1] ?? m[2]).replace(/\\'/g, "'"));
    }
    [ETIQUETAS_ICONO, ETIQUETAS_TIPO_CUENTA, ETIQUETAS_ROL].forEach((mapa) =>
      Object.values(mapa).forEach((v) => textos.add(v)),
    );

    // Un texto igual en ambos idiomas ("Internet") cuenta si está en el diccionario.
    const sinTraducir = [...textos].filter(
      (texto) => traducir(texto, undefined, 'en') === texto && !(texto in TEXTOS_EN),
    );
    expect(textos.size).toBeGreaterThan(200);
    expect(sinTraducir).toEqual([]);
  });
});

/** Contraste WCAG entre dos colores #RRGGBB. */
function contraste(a, b) {
  const luminancia = (hex) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Infracciones de axe-core en el documento. jsdom no calcula colores: el contraste se comprueba con los tokens. */
async function infracciones() {
  document.title = 'Finanzas personales'; // en la aplicación lo pone index.html; jsdom no lo tiene
  const { violations } = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

describe('HU-33 · accesibilidad', () => {
  it('Registro de un movimiento solo con teclado: Tab, Enter y Escape, y el foco vuelve al botón que abrió el panel', async () => {
    const fetchSimulado = simularServidor();
    await montarApp({ ruta: '/movimientos', escritorio: true });
    const teclado = userEvent.setup();
    const nuevo = await screen.findByRole('button', { name: 'Nuevo movimiento' });

    // Se llega al botón recorriendo la página con Tab (empieza en "Saltar al contenido").
    await teclado.tab();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
    for (let i = 0; i < 30 && document.activeElement !== nuevo; i += 1) await teclado.tab();
    expect(nuevo).toHaveFocus();

    // Escape cierra sin guardar y devuelve el foco.
    await teclado.keyboard('{Enter}');
    expect(await screen.findByRole('dialog', { name: 'Nuevo movimiento' })).toBeInTheDocument();
    await teclado.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(nuevo).toHaveFocus();

    // Se abre otra vez, se completa campo por campo con Tab y se registra con Enter.
    await teclado.keyboard('{Enter}');
    const dialogo = await screen.findByRole('dialog', { name: 'Nuevo movimiento' });
    const monto = within(dialogo).getByLabelText('Monto');
    expect(monto).toHaveFocus();
    await teclado.keyboard('25');
    await teclado.tab();
    const categoria = within(dialogo).getByLabelText('Categoría');
    expect(categoria).toHaveFocus();
    await teclado.selectOptions(categoria, CATEGORIA.id); // la lista nativa se maneja con flechas y Enter
    await teclado.tab();
    expect(within(dialogo).getByLabelText('Cuenta')).toHaveFocus();
    await teclado.tab();
    expect(within(dialogo).getByLabelText('Fecha')).toHaveFocus();
    await teclado.tab();
    const descripcion = within(dialogo).getByLabelText('Descripción (opcional)');
    expect(descripcion).toHaveFocus();
    await teclado.keyboard('Pan{Enter}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const [alta] = llamadasA(fetchSimulado, '/movimientos').filter(([, o]) => o?.method === 'POST');
    expect(cuerpoDe(alta)).toMatchObject({
      monto: '25.00',
      categoriaId: CATEGORIA.id,
      cuentaId: CUENTA.id,
      descripcion: 'Pan',
    });
    expect(nuevo).toHaveFocus();
  });

  it('Registro de un movimiento solo con teclado: el foco siempre es visible', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toMatch(/:focus-visible\s*{\s*outline:\s*2px solid var\(--color-sello\)/);
    // Ningún control quita el contorno de foco.
    expect(css).not.toMatch(/outline:\s*(none|0)\b/);
  });

  it('Texto grande y alto contraste: se activan en el perfil, se aplican en todas las pantallas y se guardan', async () => {
    const fetchSimulado = simularServidor();
    await montarApp({ ruta: '/perfil', escritorio: true });
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole('switch', { name: 'Texto grande' }));
    await waitFor(() => expect(llamadasA(fetchSimulado, '/perfil/preferencias')).toHaveLength(1));
    await usuario.click(screen.getByRole('switch', { name: 'Alto contraste' }));
    await waitFor(() => expect(llamadasA(fetchSimulado, '/perfil/preferencias')).toHaveLength(2));

    expect(raiz().dataset).toMatchObject({ texto: 'grande', contraste: 'alto' });
    expect(llamadasA(fetchSimulado, '/perfil/preferencias').map(cuerpoDe)).toEqual([
      { textoGrande: true },
      { altoContraste: true },
    ]);

    // Al ir a otra pantalla siguen activas: se aplican sobre <html>, para toda la aplicación.
    await usuario.click(
      within(screen.getAllByRole('navigation', { name: 'Principal' })[0]).getByRole('link', {
        name: 'Movimientos',
      }),
    );
    expect(await screen.findByRole('heading', { name: 'Movimientos', level: 1 })).toBeInTheDocument();
    expect(raiz().dataset).toMatchObject({ texto: 'grande', contraste: 'alto' });
  });

  it('Texto grande y alto contraste: se conservan al volver a iniciar sesión', async () => {
    simularServidor({ sesion: { ...USUARIO_PRUEBA, textoGrande: true, altoContraste: true } });
    await montarApp({ ruta: '/', escritorio: true });
    expect(raiz().dataset).toMatchObject({ texto: 'grande', contraste: 'alto' });
  });

  it('Texto grande y alto contraste: el CSS escala el texto y los colores de alto contraste cumplen 7:1', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toMatch(/html\[data-texto='grande'\]\s*{\s*font-size:\s*125%/);
    const bloque = css.match(/html\[data-contraste='alto'\]\s*{([^}]*)}/)[1];
    const aKebab = (texto) => texto.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
    for (const [nombre, valor] of Object.entries(COLORES_ALTO_CONTRASTE)) {
      expect(bloque).toMatch(new RegExp(`--color-${aKebab(nombre)}:\\s*${valor}`, 'i'));
    }
    const c = COLORES_ALTO_CONTRASTE;
    const textoSobreFondo = [
      [c.tinta, c.hoja],
      [c.tinta, c.papel],
      [c.tintaSuave, c.hoja],
      [c.tintaSuave, c.papel],
      [c.sello, c.hoja],
      [c.hoja, c.sello],
      [c.hoja, c.selloOscuro],
      [c.tapaTexto, c.tapa],
      [c.tapaTextoSuave, c.tapa],
      [c.ingreso, c.hoja],
      [c.ingreso, c.ingresoFondo],
      [c.gasto, c.hoja],
      [c.gasto, c.gastoFondo],
      [c.hoja, c.gasto],
      [c.atencion, c.atencionFondo],
    ];
    for (const [texto, fondo] of textoSobreFondo) expect(contraste(texto, fondo)).toBeGreaterThanOrEqual(7);
    // Bordes de campos y separadores (no son texto): al menos 3:1.
    expect(contraste(c.borde, c.hoja)).toBeGreaterThanOrEqual(3);
    expect(contraste(c.filete, c.hoja)).toBeGreaterThanOrEqual(3);
  });

  it('Errores anunciados al lector de pantalla: el error se anuncia, el campo queda inválido y asociado, y recibe el foco', async () => {
    simularServidor({ sesion: null });
    await montarApp({ ruta: '/iniciar-sesion' });
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    const correo = screen.getByLabelText('Correo electrónico');
    const alertas = await screen.findAllByRole('alert');
    expect(alertas.map((a) => a.textContent)).toEqual(
      expect.arrayContaining([
        'El correo electrónico es obligatorio',
        'La contraseña es obligatoria',
      ]),
    );
    expect(correo).toHaveAttribute('aria-invalid', 'true');
    expect(correo).toHaveAccessibleDescription('El correo electrónico es obligatorio');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');
    expect(correo).toHaveFocus();
  });

  it('Mostrar la contraseña: el botón del ojo alterna el texto visible, se usa con teclado y anuncia su estado', async () => {
    const fetchSimulado = simularServidor({ sesion: null });
    await montarApp({ ruta: '/iniciar-sesion' });
    const usuario = userEvent.setup();
    const contrasena = screen.getByLabelText('Contraseña');
    const ojo = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(contrasena).toHaveAttribute('type', 'password');
    expect(ojo).toHaveAttribute('aria-pressed', 'false');
    expect(ojo).toHaveAttribute('aria-controls', contrasena.id);

    await usuario.type(contrasena, 'Secreta123');
    await usuario.tab();
    expect(ojo).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(contrasena).toHaveAttribute('type', 'text');
    expect(contrasena).toHaveValue('Secreta123');
    expect(ojo).toHaveAttribute('aria-pressed', 'true');

    await usuario.keyboard(' ');
    expect(contrasena).toHaveAttribute('type', 'password');
    expect(ojo).toHaveAttribute('aria-pressed', 'false');
    // Mostrar la contraseña no envía el formulario.
    expect(llamadasA(fetchSimulado, '/auth/login')).toHaveLength(0);
  });

  it('Gráficos y pantallas sin barreras: cada gráfico tiene nombre y una tabla equivalente con los mismos datos', async () => {
    globalThis.__graficos = {};
    simularServidor({
      rutas: {
        '/dashboard/graficos': async () =>
          respuestaApi(200, {
            data: {
              periodo: '2026-01',
              moneda: 'PEN',
              evolucion: [{ periodo: '2026-01', ingresos: '3000.00', gastos: '900.00' }],
              distribucion: {
                total: '900.00',
                items: [{ categoriaId: 'c1', nombre: 'Alimentación', total: '900.00', porcentaje: 100 }],
              },
            },
          }),
      },
    });
    await montarApp({ ruta: '/', escritorio: true });

    const evolucion = await screen.findByRole('img', { name: 'Ingresos y gastos de los últimos 1 meses' });
    const distribucion = screen.getByRole('img', { name: 'Distribución de gastos por categoría' });
    expect(evolucion).toBeInTheDocument();
    expect(distribucion).toBeInTheDocument();
    const tablas = screen.getAllByRole('table', { hidden: true });
    expect(tablas).toHaveLength(2);
    expect(within(tablas[0]).getAllByRole('row', { hidden: true })[1]).toHaveTextContent(
      /S\/ 3,000\.00.*S\/ 900\.00/,
    );
    expect(within(tablas[1]).getAllByRole('row', { hidden: true })[1]).toHaveTextContent(
      /Alimentación.*S\/ 900\.00.*100 %/,
    );
    expect(await infracciones()).toEqual([]);
  });

  it.each([
    ['/iniciar-sesion', null, 'Iniciar sesión'],
    ['/registro', null, 'Crear cuenta'],
    ['/olvide-contrasena', null, '¿Olvidaste tu contraseña?'],
    ['/movimientos', USUARIO_PRUEBA, 'Movimientos'],
    ['/cuentas', USUARIO_PRUEBA, 'Cuentas'],
    ['/categorias', USUARIO_PRUEBA, 'Categorías'],
    ['/presupuestos', USUARIO_PRUEBA, 'Presupuestos'],
    ['/perfil', USUARIO_PRUEBA, 'Mi perfil'],
  ])(
    'Gráficos y pantallas sin barreras: %s no tiene infracciones de axe-core',
    async (ruta, sesion, titulo) => {
      simularServidor({
        sesion,
        rutas: {
          '/presupuestos/seguimiento': async () =>
            respuestaApi(200, { data: [], meta: { periodo: '2026-01' } }),
        },
      });
      await montarApp({ ruta, escritorio: true });
      expect(await screen.findByRole('heading', { name: titulo, level: 1 })).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText(/^Cargando/)).not.toBeInTheDocument());
      expect(await infracciones()).toEqual([]);
    },
  );
});
