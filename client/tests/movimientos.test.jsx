// HU-08, HU-09, HU-10, HU-11, HU-26 y HU-27 · sección "Movimientos" del cliente.
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

const CUENTAS = [
  { id: '65f0000000000000000000a1', nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '500.00', saldoActual: '1460.00' },
  { id: '65f0000000000000000000a2', nombre: 'Ahorros USD', tipo: 'banco', moneda: 'USD', saldoInicial: '200.00', saldoActual: '200.00' },
];
const CATEGORIAS = [
  { id: '65f000000000000000000001', nombre: 'Alimentación', tipo: 'gasto', icono: 'utensils' },
  { id: '65f000000000000000000002', nombre: 'Transporte', tipo: 'gasto', icono: 'bus' },
  { id: '65f000000000000000000003', nombre: 'Sueldo', tipo: 'ingreso', icono: 'wallet' },
];
const GASTO = {
  id: 'm1',
  tipo: 'gasto',
  monto: '40.00',
  moneda: 'PEN',
  fecha: '2026-01-10',
  categoriaId: '65f000000000000000000001',
  cuentaId: '65f0000000000000000000a1',
  descripcion: 'Almuerzo',
  saldoResultante: '460.00',
};
const INGRESO = {
  id: 'm2',
  tipo: 'ingreso',
  monto: '1000.00',
  moneda: 'PEN',
  fecha: '2026-01-12',
  categoriaId: '65f000000000000000000003',
  cuentaId: '65f0000000000000000000a1',
  descripcion: '',
  saldoResultante: '1460.00',
};
const lista = (items, total = items.length) =>
  respuestaApi(200, { data: items, meta: { page: 1, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) } });
const cuerpoDe = (llamada) => JSON.parse(llamada[1].body);

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Abre /movimientos con un "servidor" simulado que guarda los movimientos en memoria. */
async function abrir({ inicial = [INGRESO, GASTO], cuentas = CUENTAS, rutas = {}, advertencias } = {}) {
  let movimientos = [...inicial];
  const fetchSimulado = simularFetch(undefined, {
    rutas: {
      '/cuentas': async () => respuestaApi(200, { data: cuentas, meta: { page: 1, limit: 100, total: cuentas.length } }),
      '/categorias': async () => respuestaApi(200, { data: CATEGORIAS, meta: { page: 1, limit: 100, total: 3 } }),
      '/movimientos': async (opciones) => {
        if (opciones?.method === 'POST') {
          const nuevo = { id: `n${movimientos.length + 1}`, moneda: 'PEN', saldoResultante: '0.00', ...JSON.parse(opciones.body) };
          movimientos = [nuevo, ...movimientos];
          return respuestaApi(201, { data: nuevo, ...(advertencias && { meta: { advertencias } }) });
        }
        return lista(movimientos);
      },
      '/movimientos/m1': async (opciones) => {
        if (opciones?.method === 'PATCH') {
          movimientos = movimientos.map((m) => (m.id === 'm1' ? { ...m, ...JSON.parse(opciones.body), moneda: 'PEN' } : m));
          return respuestaApi(200, { data: movimientos.find((m) => m.id === 'm1') });
        }
        movimientos = movimientos.filter((m) => m.id !== 'm1');
        return respuestaApi(204);
      },
      ...rutas,
    },
  });
  await montarApp({ ruta: '/movimientos', escritorio: true });
  return { fetchSimulado, usuario: userEvent.setup() };
}

async function abrirFormulario(entorno) {
  await screen.findByText('Almuerzo');
  await entorno.usuario.click(screen.getByRole('button', { name: 'Nuevo movimiento' }));
  return within(screen.getByRole('dialog', { name: 'Nuevo movimiento' }));
}

describe('HU-26 · historial con saldo resultante', () => {
  it('muestra descripción, categoría, cuenta, fecha, monto con signo y el saldo que dejó cada movimiento', async () => {
    await abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Movimientos' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Movimientos' }).length).toBeGreaterThan(0);

    const filas = (await screen.findAllByRole('listitem')).filter((li) => li.textContent.includes('Saldo'));
    expect(filas).toHaveLength(2);
    const gasto = within(filas.find((f) => f.textContent.includes('Almuerzo')));
    expect(gasto.getByText(/Alimentación · Efectivo/)).toBeInTheDocument();
    expect(gasto.getByText('Gasto:')).toBeInTheDocument(); // el signo no depende solo del color
    expect(gasto.getByText('S/ 40.00', { exact: false })).toBeInTheDocument();
    expect(gasto.getByText('Saldo S/ 460.00')).toBeInTheDocument();
    const ingreso = within(filas.find((f) => f.textContent.includes('Sueldo')));
    expect(ingreso.getByText('Ingreso:')).toBeInTheDocument();
    expect(ingreso.getByText('Saldo S/ 1,460.00')).toBeInTheDocument();
  });

  it('sin cuentas indica que primero hay que crear una; con cuentas invita a registrar', async () => {
    await abrir({ inicial: [], cuentas: [] });
    expect(await screen.findByText(/primero crea una cuenta/)).toBeInTheDocument();
    cleanup();
    await abrir({ inicial: [] });
    expect(await screen.findByText(/Aún no tienes movimientos registrados/)).toBeInTheDocument();
  });

  it('un error de carga muestra el mensaje y permite reintentar', async () => {
    let falla = true;
    const { usuario } = await abrir({
      rutas: {
        '/movimientos': async () =>
          falla
            ? respuestaError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado. Inténtalo nuevamente.')
            : lista([GASTO]),
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el historial. Intenta nuevamente');
    falla = false;
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Almuerzo')).toBeInTheDocument();
  });

  it('pagina el historial y pide la página elegida', async () => {
    const { fetchSimulado, usuario } = await abrir({
      rutas: {
        '/movimientos': async () =>
          respuestaApi(200, { data: [GASTO], meta: { page: 1, limit: 20, total: 45, totalPages: 3 } }),
      },
    });
    await screen.findByText('Página 1 de 3');
    fetchSimulado.mockClear();
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(llamadasA(fetchSimulado, '/movimientos')[0][0]).toContain('page=2'));
  });
});

describe('HU-10 · HU-11 · consulta y filtrado', () => {
  const ultimaUrl = (fetchSimulado) => llamadasA(fetchSimulado, '/movimientos').at(-1)[0];

  it('Ver detalle: abre el panel con todos los datos del movimiento', async () => {
    const { usuario } = await abrir();
    await usuario.click(await screen.findByRole('button', { name: /Ver detalle del movimiento del 2026-01-10/ }));
    const panel = within(screen.getByRole('dialog', { name: 'Detalle del movimiento' }));
    expect(panel.getByText('Almuerzo')).toBeInTheDocument();
    expect(panel.getByText('Alimentación')).toBeInTheDocument();
    expect(panel.getByText('Efectivo')).toBeInTheDocument();
    expect(panel.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    await usuario.click(panel.getAllByRole('button', { name: 'Cerrar' }).at(-1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Historial vacío: invita a registrar el primer movimiento', async () => {
    const { usuario } = await abrir({ inicial: [] });
    await screen.findByText('Aún no tienes movimientos registrados');
    await usuario.click(screen.getByRole('button', { name: 'Registrar el primer movimiento' }));
    expect(screen.getByRole('dialog', { name: 'Nuevo movimiento' })).toBeInTheDocument();
  });

  it('Filtra por rango de fechas y categoría y los envía al servidor', async () => {
    const { fetchSimulado, usuario } = await abrir();
    await screen.findByText('Almuerzo');
    const filtros = within(screen.getByRole('form', { name: 'Filtros del historial' }));
    fireEvent.change(filtros.getByLabelText('Desde'), { target: { value: '2026-01-01' } });
    fireEvent.change(filtros.getByLabelText('Hasta'), { target: { value: '2026-01-31' } });
    await usuario.selectOptions(filtros.getByLabelText('Categoría'), '65f000000000000000000001');
    await usuario.click(filtros.getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() => {
      const url = ultimaUrl(fetchSimulado);
      expect(url).toContain('desde=2026-01-01');
      expect(url).toContain('hasta=2026-01-31');
      expect(url).toContain('categoriaId=65f000000000000000000001');
    });
  });

  it('Rango de fechas inválido: avisa y no permite aplicar', async () => {
    await abrir();
    await screen.findByText('Almuerzo');
    const filtros = within(screen.getByRole('form', { name: 'Filtros del historial' }));
    fireEvent.change(filtros.getByLabelText('Desde'), { target: { value: '2026-02-01' } });
    fireEvent.change(filtros.getByLabelText('Hasta'), { target: { value: '2026-01-01' } });
    expect(await screen.findByText('La fecha inicial no puede ser mayor a la fecha final')).toBeInTheDocument();
    expect(filtros.getByRole('button', { name: 'Aplicar filtros' })).toBeDisabled();
  });

  it('Sin resultados: muestra el mensaje y "Limpiar filtros" restablece el historial', async () => {
    let sinResultados = false;
    const { usuario } = await abrir({
      rutas: { '/movimientos': async () => (sinResultados ? lista([]) : lista([GASTO])) },
    });
    await screen.findByText('Almuerzo');
    sinResultados = true;
    const filtros = within(screen.getByRole('form', { name: 'Filtros del historial' }));
    await usuario.selectOptions(filtros.getByLabelText('Tipo'), 'ingreso');
    await usuario.click(filtros.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByText('No se encontraron movimientos con los filtros seleccionados')).toBeInTheDocument();
    sinResultados = false;
    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(await screen.findByText('Almuerzo')).toBeInTheDocument();
  });
});

describe('HU-08 · registrar', () => {
  it('Registro exitoso: envía los datos del formulario, lo muestra en el historial y notifica', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    expect(panel.getByLabelText('Tipo')).toHaveValue('gasto');
    expect(panel.getByLabelText('Fecha')).toHaveValue(fechaHoy());

    await entorno.usuario.type(panel.getByLabelText('Monto'), '150');
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), '65f000000000000000000002');
    await entorno.usuario.selectOptions(panel.getByLabelText('Cuenta'), '65f0000000000000000000a1');
    await entorno.usuario.type(panel.getByLabelText('Descripción (opcional)'), '  Taxi al trabajo ');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El movimiento se registró'));
    const envio = llamadasA(entorno.fetchSimulado, '/movimientos').find(([, o]) => o?.method === 'POST');
    expect(cuerpoDe(envio)).toEqual({
      tipo: 'gasto',
      monto: '150.00',
      categoriaId: '65f000000000000000000002',
      cuentaId: '65f0000000000000000000a1',
      fecha: fechaHoy(),
      descripcion: 'Taxi al trabajo',
    });
    expect(await screen.findByText('Taxi al trabajo')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(notificar.atencion).not.toHaveBeenCalled();
  });

  it('Registro rechazado por monto o fecha inválidos: muestra los mensajes y no llama a la API', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '0');
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), '65f000000000000000000001');
    await entorno.usuario.selectOptions(panel.getByLabelText('Cuenta'), '65f0000000000000000000a1');
    fireEvent.change(panel.getByLabelText('Fecha'), { target: { value: '' } });
    await entorno.usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));

    expect(await panel.findByText('El monto debe ser mayor a 0, con hasta 2 decimales')).toBeInTheDocument();
    expect(panel.getByText('La fecha es obligatoria')).toBeInTheDocument();
    expect(llamadasA(entorno.fetchSimulado, '/movimientos').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);

    await entorno.usuario.clear(panel.getByLabelText('Monto'));
    await entorno.usuario.type(panel.getByLabelText('Monto'), '-5');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));
    expect(await panel.findByText('El monto debe ser mayor a 0, con hasta 2 decimales')).toBeInTheDocument();
  });

  it('Sin categoría ni cuenta pide seleccionarlas', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '10');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));
    const alertas = (await panel.findAllByRole('alert')).map((a) => a.textContent);
    expect(alertas).toEqual(expect.arrayContaining(['Selecciona una categoría', 'Selecciona una cuenta']));
  });

  it('Registro permitido con saldo insuficiente: se registra y se muestra la advertencia', async () => {
    const entorno = await abrir({ advertencias: ['El monto excede el saldo disponible de la cuenta'] });
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '99999');
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), '65f000000000000000000001');
    await entorno.usuario.selectOptions(panel.getByLabelText('Cuenta'), '65f0000000000000000000a1');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El movimiento se registró'));
    expect(notificar.atencion).toHaveBeenCalledWith('El monto excede el saldo disponible de la cuenta');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Categoría incompatible con el tipo: al cambiar a Ingreso se quita la categoría y se pide una de ingreso', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), '65f000000000000000000001');
    expect(within(panel.getByLabelText('Categoría')).queryByRole('option', { name: 'Sueldo' })).not.toBeInTheDocument();

    await entorno.usuario.selectOptions(panel.getByLabelText('Tipo'), 'ingreso');
    expect(await panel.findByText('Selecciona una categoría de ingreso')).toBeInTheDocument();
    expect(panel.getByLabelText('Categoría')).toHaveValue('');
    const opciones = within(panel.getByLabelText('Categoría')).getAllByRole('option').map((o) => o.textContent);
    expect(opciones).toEqual(['Selecciona una categoría', 'Sueldo']);
  });

  it('Fecha futura rechazada: muestra "La fecha no puede ser futura" y no llama a la API', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '10');
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), '65f000000000000000000001');
    await entorno.usuario.selectOptions(panel.getByLabelText('Cuenta'), '65f0000000000000000000a1');
    fireEvent.change(panel.getByLabelText('Fecha'), { target: { value: '2099-12-31' } });
    await entorno.usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));

    expect(await panel.findByText('La fecha no puede ser futura')).toBeInTheDocument();
    expect(llamadasA(entorno.fetchSimulado, '/movimientos').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });

  it('Un error del servidor en un campo se muestra junto a ese campo y conserva el panel', async () => {
    const entorno = await abrir({
      rutas: {
        '/movimientos': async (opciones) =>
          opciones?.method === 'POST'
            ? respuestaError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', [
                { campo: 'cuentaId', mensaje: 'La cuenta seleccionada no existe' },
              ])
            : lista([GASTO]),
      },
    });
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.type(panel.getByLabelText('Monto'), '10');
    await entorno.usuario.selectOptions(panel.getByLabelText('Categoría'), '65f000000000000000000001');
    await entorno.usuario.selectOptions(panel.getByLabelText('Cuenta'), '65f0000000000000000000a1');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Registrar movimiento' }));
    expect(await panel.findByText('La cuenta seleccionada no existe')).toBeInTheDocument();
  });

  it('Cancelar cierra el panel sin llamar a la API', async () => {
    const entorno = await abrir();
    const panel = await abrirFormulario(entorno);
    await entorno.usuario.click(panel.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(llamadasA(entorno.fetchSimulado, '/movimientos').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });
});

describe('HU-09 · HU-27 · editar', () => {
  const abrirEdicion = async (entorno) => {
    await screen.findByText('Almuerzo');
    await entorno.usuario.click(screen.getByRole('button', { name: 'Editar movimiento del 2026-01-10 por 40.00' }));
    return within(screen.getByRole('dialog', { name: 'Editar movimiento' }));
  };

  it('Edición exitosa: precarga el movimiento, envía los cambios y actualiza el historial', async () => {
    const entorno = await abrir();
    const panel = await abrirEdicion(entorno);
    expect(panel.getByLabelText('Monto')).toHaveValue('40.00');
    expect(panel.getByLabelText('Categoría')).toHaveValue('65f000000000000000000001');
    expect(panel.getByLabelText('Cuenta')).toHaveValue('65f0000000000000000000a1');
    expect(panel.getByLabelText('Fecha')).toHaveValue('2026-01-10');

    await entorno.usuario.clear(panel.getByLabelText('Monto'));
    await entorno.usuario.type(panel.getByLabelText('Monto'), '60');
    await entorno.usuario.clear(panel.getByLabelText('Descripción (opcional)'));
    await entorno.usuario.type(panel.getByLabelText('Descripción (opcional)'), 'Cena');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El movimiento se actualizó'));
    const envio = llamadasA(entorno.fetchSimulado, '/movimientos/m1')[0];
    expect(envio[1].method).toBe('PATCH');
    expect(cuerpoDe(envio)).toMatchObject({ monto: '60.00', descripcion: 'Cena', categoriaId: '65f000000000000000000001', cuentaId: '65f0000000000000000000a1' });
    expect(await screen.findByText('Cena')).toBeInTheDocument();
    expect(screen.queryByText('Almuerzo')).not.toBeInTheDocument();
  });

  it('Cambio de cuenta al editar: envía la cuenta nueva', async () => {
    const entorno = await abrir();
    const panel = await abrirEdicion(entorno);
    await entorno.usuario.selectOptions(panel.getByLabelText('Cuenta'), '65f0000000000000000000a2');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El movimiento se actualizó'));
    expect(cuerpoDe(llamadasA(entorno.fetchSimulado, '/movimientos/m1')[0])).toMatchObject({ cuentaId: '65f0000000000000000000a2' });
  });

  it('Edición rechazada por datos inválidos: muestra el mensaje y no llama a la API', async () => {
    const entorno = await abrir();
    const panel = await abrirEdicion(entorno);
    await entorno.usuario.clear(panel.getByLabelText('Monto'));
    await entorno.usuario.type(panel.getByLabelText('Monto'), '0');
    await entorno.usuario.click(panel.getByRole('button', { name: 'Guardar cambios' }));

    expect(await panel.findByText('El monto debe ser mayor a 0, con hasta 2 decimales')).toBeInTheDocument();
    expect(llamadasA(entorno.fetchSimulado, '/movimientos/m1')).toHaveLength(0);
    expect(screen.getByText('Almuerzo')).toBeInTheDocument();
  });
});

describe('HU-09 · eliminar', () => {
  it('Eliminación exitosa: confirma, llama a la API, actualiza el historial y notifica', async () => {
    confirmar.mockResolvedValue(true);
    const entorno = await abrir();
    await screen.findByText('Almuerzo');
    await entorno.usuario.click(screen.getByRole('button', { name: 'Eliminar movimiento del 2026-01-10 por 40.00' }));

    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ confirmar: 'Eliminar', peligro: true }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('El movimiento se eliminó'));
    expect(llamadasA(entorno.fetchSimulado, '/movimientos/m1')[0][1].method).toBe('DELETE');
    await waitFor(() => expect(screen.queryByText('Almuerzo')).not.toBeInTheDocument());
  });

  it('Eliminación sin confirmar: no llama a la API y el movimiento se conserva', async () => {
    confirmar.mockResolvedValue(false);
    const entorno = await abrir();
    await screen.findByText('Almuerzo');
    await entorno.usuario.click(screen.getByRole('button', { name: 'Eliminar movimiento del 2026-01-10 por 40.00' }));
    expect(confirmar).toHaveBeenCalled();
    expect(llamadasA(entorno.fetchSimulado, '/movimientos/m1')).toHaveLength(0);
    expect(screen.getByText('Almuerzo')).toBeInTheDocument();
  });

  it('Un error al eliminar muestra el mensaje y conserva el movimiento', async () => {
    confirmar.mockResolvedValue(true);
    const entorno = await abrir({
      rutas: { '/movimientos/m1': async () => respuestaError(404, 'NOT_FOUND', 'El recurso solicitado no existe o no tienes permiso para acceder a él') },
    });
    await screen.findByText('Almuerzo');
    await entorno.usuario.click(screen.getByRole('button', { name: 'Eliminar movimiento del 2026-01-10 por 40.00' }));
    await waitFor(() => expect(notificar.error).toHaveBeenCalledWith(expect.stringContaining('no existe')));
    expect(screen.getByText('Almuerzo')).toBeInTheDocument();
  });
});
