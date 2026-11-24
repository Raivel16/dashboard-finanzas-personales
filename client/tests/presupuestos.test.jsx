// HU-14, HU-15, HU-29 y HU-30 · sección "Presupuestos" del cliente y avisos al registrar un gasto.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fechaHoy } from '@finanzas/shared';
import { llamadasA, montarApp, respuestaApi, respuestaError, simularFetch } from './ayudas.jsx';
import { confirmar, notificar } from '../src/shared/utils/notificaciones.js';

vi.mock('../src/shared/utils/notificaciones.js', () => ({
  confirmar: vi.fn(),
  notificar: { exito: vi.fn(), error: vi.fn(), atencion: vi.fn(), info: vi.fn() },
}));

const MES = fechaHoy().slice(0, 7);
const ALIMENTACION = '65f000000000000000000001';
const SUELDO = '65f000000000000000000003';
const CATEGORIAS = [
  { id: ALIMENTACION, nombre: 'Alimentación', tipo: 'gasto', icono: 'utensils' },
  { id: '65f000000000000000000002', nombre: 'Entretenimiento', tipo: 'gasto', icono: 'clapperboard' },
  { id: SUELDO, nombre: 'Sueldo', tipo: 'ingreso', icono: 'wallet' },
];
const GENERAL = {
  id: 'p1',
  periodo: MES,
  moneda: 'PEN',
  categoriaId: null,
  monto: '1500.00',
  gastado: '900.00',
  restante: '600.00',
  porcentaje: 60,
  excedido: false,
  sobregiro: '0.00',
  sinAsignar: '1200.00',
};
const DE_CATEGORIA = {
  ...GENERAL,
  id: 'p2',
  categoriaId: ALIMENTACION,
  monto: '300.00',
  gastado: '0.00',
  restante: '300.00',
  porcentaje: 0,
  sinAsignar: undefined,
};
const seguimiento = (items) => respuestaApi(200, { data: items, meta: { periodo: MES } });
const cuerpoDe = (llamada) => JSON.parse(llamada[1].body);

beforeEach(() => {
  vi.clearAllMocks();
  confirmar.mockResolvedValue(true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Abre /presupuestos con un "servidor" simulado que responde el seguimiento que se le indique. */
async function abrir({ items = [GENERAL], rutas = {} } = {}) {
  let actuales = [...items];
  const fetchSimulado = simularFetch(undefined, {
    rutas: {
      '/categorias': async () => respuestaApi(200, { data: CATEGORIAS, meta: { page: 1, limit: 100, total: 3 } }),
      '/presupuestos/seguimiento': async () => seguimiento(actuales),
      '/presupuestos': async (opciones) => {
        if (opciones?.method === 'POST') {
          const nuevo = { ...GENERAL, id: 'nuevo', ...JSON.parse(opciones.body), gastado: '0.00', porcentaje: 0 };
          actuales = [...actuales, nuevo];
          return respuestaApi(201, { data: nuevo });
        }
        return respuestaApi(200, { data: actuales, meta: { page: 1, limit: 20, total: actuales.length } });
      },
      '/presupuestos/p1': async (opciones) => {
        if (opciones?.method === 'PUT') {
          actuales = actuales.map((p) => (p.id === 'p1' ? { ...p, ...JSON.parse(opciones.body) } : p));
          return respuestaApi(200, { data: actuales.find((p) => p.id === 'p1') });
        }
        actuales = actuales.filter((p) => p.id !== 'p1');
        return respuestaApi(204);
      },
      ...rutas,
    },
  });
  await montarApp({ ruta: '/presupuestos', escritorio: true });
  return { fetchSimulado, usuario: userEvent.setup() };
}

async function abrirFormulario(entorno) {
  await entorno.usuario.click(await screen.findByRole('button', { name: 'Nuevo presupuesto' }));
  return within(screen.getByRole('dialog', { name: 'Nuevo presupuesto' }));
}

describe('HU-15 · seguimiento', () => {
  it('Avance del 60 %: barra de progreso, porcentaje y monto restante', async () => {
    await abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Presupuestos' })).toBeInTheDocument();
    const barra = await screen.findByRole('progressbar', { name: 'Presupuesto general: 60% utilizado' });
    expect(barra).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByText(/60 % utilizado · Quedan S\/ 600\.00/)).toBeInTheDocument();
    expect(screen.getByText(/S\/ 900\.00 de S\/ 1,500\.00/)).toBeInTheDocument();
    expect(screen.getByText('Sin asignar a categorías: S/ 1,200.00')).toBeInTheDocument();
  });

  it('Presupuesto excedido: barra al límite, porcentaje excedido y monto sobregirado', async () => {
    await abrir({
      items: [{ ...GENERAL, gastado: '1725.00', restante: '0.00', porcentaje: 115, excedido: true, sobregiro: '225.00' }],
    });
    const barra = await screen.findByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(/115 % utilizado · Excedido por S\/ 225\.00/)).toBeInTheDocument();
  });

  it('Sin presupuesto definido: mensaje con acceso directo para crearlo', async () => {
    const entorno = await abrir({ items: [] });
    expect(await screen.findByText('No has definido un presupuesto para este mes')).toBeInTheDocument();
    await entorno.usuario.click(screen.getByRole('button', { name: 'Definir presupuesto' }));
    expect(screen.getByRole('dialog', { name: 'Nuevo presupuesto' })).toBeInTheDocument();
  });

  it('Presupuestos independientes por moneda: se muestran agrupados por su moneda', async () => {
    await abrir({
      items: [GENERAL, { ...GENERAL, id: 'p3', moneda: 'USD', monto: '200.00', gastado: '50.00', porcentaje: 25 }],
    });
    expect(await screen.findByRole('heading', { name: 'Presupuestos en PEN' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Presupuestos en USD' })).toBeInTheDocument();
    expect(screen.getByText(/25 % utilizado/)).toBeInTheDocument();
  });

  it('Un error de carga muestra el mensaje y permite reintentar', async () => {
    let falla = true;
    const { usuario } = await abrir({
      rutas: {
        '/presupuestos/seguimiento': async () =>
          falla ? respuestaError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado.') : seguimiento([GENERAL]),
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los presupuestos');
    falla = false;
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  it('Un mes pasado se consulta pero no se puede editar', async () => {
    await abrir();
    await screen.findByRole('progressbar');
    fireEvent.change(screen.getByLabelText('Mes'), { target: { value: '2020-01' } });
    await waitFor(() => expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument());
  });
});

describe('HU-14 · definir presupuesto', () => {
  it('Definición exitosa: envía mes, moneda y monto y muestra el presupuesto', async () => {
    const entorno = await abrir({ items: [] });
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.selectOptions(panel.getByLabelText('Moneda'), 'PEN');
    await entorno.usuario.type(panel.getByLabelText('Monto'), '1500');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar presupuesto' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El presupuesto se guardó'));
    const envio = llamadasA(entorno.fetchSimulado, '/presupuestos').find(([, o]) => o?.method === 'POST');
    expect(cuerpoDe(envio)).toEqual({ periodo: MES, moneda: 'PEN', monto: '1500.00' });
    expect(confirmar).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Asignación por categoría: solo ofrece categorías de gasto y envía la elegida', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    const opciones = within(panel.getByLabelText('Categoría')).getAllByRole('option');
    expect(opciones.map((o) => o.textContent)).toEqual([
      'Presupuesto general (todas las categorías)',
      'Alimentación',
      'Entretenimiento',
    ]);
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), ALIMENTACION);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '300');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar presupuesto' }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalled());
    const envio = llamadasA(entorno.fetchSimulado, '/presupuestos').find(([, o]) => o?.method === 'POST');
    expect(cuerpoDe(envio)).toMatchObject({ categoriaId: ALIMENTACION, monto: '300.00' });
  });

  it.each([['-5'], [''], ['0']])('Monto inválido (%j): muestra el mensaje y no llama a la API', async (monto) => {
    const entorno = await abrir({ items: [] });
    const panel = await abrirFormulario(entorno);
    if (monto) await entorno.usuario.type(panel.getByLabelText('Monto'), monto);
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar presupuesto' }));
    expect(await panel.findByText('El presupuesto debe ser un monto mayor a 0')).toBeInTheDocument();
    expect(llamadasA(entorno.fetchSimulado, '/presupuestos').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });

  it('Confirmación para reemplazar: con confirmar cambia el monto con PUT', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '2000');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar presupuesto' }));

    await waitFor(() =>
      expect(confirmar).toHaveBeenCalledWith(
        expect.objectContaining({ texto: 'Ya existe un presupuesto para este mes, ¿deseas reemplazarlo?' }),
      ),
    );
    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El presupuesto se reemplazó'));
    const envio = llamadasA(entorno.fetchSimulado, '/presupuestos/p1').find(([, o]) => o?.method === 'PUT');
    expect(cuerpoDe(envio)).toEqual({ monto: '2000.00' });
  });

  it('Sin confirmar el reemplazo no se llama a la API y el panel se conserva', async () => {
    confirmar.mockResolvedValue(false);
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '2000');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar presupuesto' }));
    await waitFor(() => expect(confirmar).toHaveBeenCalled());
    const escrituras = llamadasA(entorno.fetchSimulado, '/presupuestos/p1').filter(([, o]) => o?.method === 'PUT');
    expect(escrituras).toHaveLength(0);
    expect(screen.getByRole('dialog', { name: 'Nuevo presupuesto' })).toBeInTheDocument();
  });

  it('Editar cambia solo el monto, sin pedir confirmación', async () => {
    const entorno = await abrir();
    await entorno.usuario.click(await screen.findByRole('button', { name: 'Editar Presupuesto general en PEN' }));
    const panel = within(screen.getByRole('dialog', { name: 'Editar presupuesto' }));
    const monto = panel.getByLabelText('Monto');
    await entorno.usuario.clear(monto);
    await entorno.usuario.type(monto, '1800');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El presupuesto se reemplazó'));
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('Eliminar pide confirmación; sin confirmar no se llama a la API', async () => {
    confirmar.mockResolvedValueOnce(false);
    const entorno = await abrir();
    const boton = await screen.findByRole('button', { name: 'Eliminar Presupuesto general en PEN' });
    await entorno.usuario.click(boton);
    expect(llamadasA(entorno.fetchSimulado, '/presupuestos/p1').filter(([, o]) => o?.method === 'DELETE')).toHaveLength(0);
    await entorno.usuario.click(boton);
    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El presupuesto se eliminó'));
  });

  it('Un general con categorías no se elimina: muestra el mensaje del servidor', async () => {
    const entorno = await abrir({
      items: [GENERAL, DE_CATEGORIA],
      rutas: {
        '/presupuestos/p1': async () =>
          respuestaError(409, 'CONFLICT', 'Elimina primero los presupuestos por categoría de ese mes'),
      },
    });
    await entorno.usuario.click(await screen.findByRole('button', { name: 'Eliminar Presupuesto general en PEN' }));
    await waitFor(() =>
      expect(notificar.error).toHaveBeenCalledWith('Elimina primero los presupuestos por categoría de ese mes'),
    );
  });
});

describe('HU-29 · HU-30 · reglas de mes y de suma', () => {
  it('Mes pasado rechazado: muestra el mensaje y no llama a la API', async () => {
    const entorno = await abrir({ items: [] });
    const panel = await abrirFormulario(entorno);
    fireEvent.change(panel.getByLabelText('Mes'), { target: { value: '2020-01' } });
    await entorno.usuario.type(panel.getByLabelText('Monto'), '100');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar presupuesto' }));
    expect(
      await panel.findByText('Solo puedes definir presupuestos para el mes actual o meses futuros'),
    ).toBeInTheDocument();
    expect(llamadasA(entorno.fetchSimulado, '/presupuestos').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });

  it('Suma superior al general: el mensaje del servidor aparece junto al monto y el panel se conserva', async () => {
    const entorno = await abrir({
      rutas: {
        '/presupuestos': async (opciones) =>
          opciones?.method === 'POST'
            ? respuestaError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', [
                { campo: 'monto', mensaje: 'La suma por categorías supera el presupuesto general' },
              ])
            : respuestaApi(200, { data: [], meta: { page: 1, limit: 20, total: 0 } }),
      },
    });
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), ALIMENTACION);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '300');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar presupuesto' }));
    expect(await panel.findByText('La suma por categorías supera el presupuesto general')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Nuevo presupuesto' })).toBeInTheDocument();
  });
});

describe('HU-15 · alertas al registrar un gasto', () => {
  async function registrarGasto(meta) {
    const fetchSimulado = simularFetch(undefined, {
      rutas: {
        '/cuentas': async () =>
          respuestaApi(200, {
            data: [
              { id: '65f0000000000000000000a1', nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '500.00', saldoActual: '500.00' },
            ],
            meta: { page: 1, limit: 100, total: 1 },
          }),
        '/categorias': async () => respuestaApi(200, { data: CATEGORIAS, meta: { page: 1, limit: 100, total: 3 } }),
        '/movimientos': async (opciones) =>
          opciones?.method === 'POST'
            ? respuestaApi(201, { data: { id: 'n1', moneda: 'PEN', saldoResultante: '0.00' }, meta })
            : respuestaApi(200, { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
      },
    });
    await montarApp({ ruta: '/movimientos', escritorio: true });
    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Nuevo movimiento' }));
    const panel = within(screen.getByRole('dialog', { name: 'Nuevo movimiento' }));
    await usuario.type(panel.getByLabelText('Monto'), '900');
    await usuario.selectOptions(panel.getByLabelText('Categoría'), ALIMENTACION);
    await usuario.selectOptions(panel.getByLabelText('Cuenta'), '65f0000000000000000000a1');
    await usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalled());
    return fetchSimulado;
  }

  it('Al cruzar el 90 % del general muestra "Has utilizado el 90% de tu presupuesto mensual"', async () => {
    await registrarGasto({ alertas: [{ presupuestoId: 'p1', umbral: 90, porcentaje: 90, categoriaId: null }] });
    expect(notificar.atencion).toHaveBeenCalledWith('Has utilizado el 90% de tu presupuesto mensual');
  });

  it('Al cruzar el 90 % de una categoría nombra la categoría', async () => {
    await registrarGasto({ alertas: [{ presupuestoId: 'p2', umbral: 90, porcentaje: 93, categoriaId: ALIMENTACION }] });
    expect(notificar.atencion).toHaveBeenCalledWith('Has utilizado el 93% del presupuesto de Alimentación');
  });

  it('Al superar el 100 % avisa que se excedió', async () => {
    await registrarGasto({ alertas: [{ presupuestoId: 'p1', umbral: 100, porcentaje: 115, categoriaId: null }] });
    expect(notificar.error).toHaveBeenCalledWith('Superaste tu presupuesto mensual');
  });

  it('Sin alertas no avisa de presupuestos', async () => {
    await registrarGasto(undefined);
    expect(notificar.atencion).not.toHaveBeenCalled();
    expect(notificar.error).not.toHaveBeenCalled();
  });
});

describe('Administración · presupuestos de otra persona', () => {
  it('Se muestran en solo lectura, con su categoría y monto, sin botones de acción', async () => {
    const fetchSimulado = simularFetch(undefined, {
      sesion: { id: 'a1', nombre: 'Admin', email: 'a@correo.com', rol: 'admin', monedaPrincipal: 'PEN' },
      rutas: {
        '/admin/usuarios/u2': async () =>
          respuestaApi(200, {
            data: { id: 'u2', nombre: 'Ana Torres', email: 'ana@correo.com', rol: 'usuario', monedaPrincipal: 'PEN' },
          }),
        '/admin/usuarios/u2/categorias': async () => respuestaApi(200, { data: CATEGORIAS, meta: { total: 3 } }),
        '/admin/usuarios/u2/cuentas': async () => respuestaApi(200, { data: [], meta: { total: 0 } }),
        '/admin/usuarios/u2/movimientos': async () => respuestaApi(200, { data: [], meta: { total: 0 } }),
        '/admin/usuarios/u2/presupuestos': async () =>
          respuestaApi(200, {
            data: [{ id: 'p9', periodo: MES, moneda: 'PEN', categoriaId: ALIMENTACION, monto: '300.00' }],
            meta: { total: 1 },
          }),
      },
    });
    await montarApp({ ruta: '/administracion/usuarios/u2', escritorio: true });
    const seccion = within(await screen.findByRole('region', { name: 'Presupuestos' }));
    expect(await seccion.findByText('Alimentación')).toBeInTheDocument();
    expect(seccion.getByText('S/ 300.00')).toBeInTheDocument();
    expect(seccion.queryByRole('button')).not.toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/admin/usuarios/u2/presupuestos')).toHaveLength(1);
  });
});
