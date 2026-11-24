// HU-07 y HU-25 · sección "Cuentas" del cliente.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { llamadasA, montarApp, respuestaApi, respuestaError, simularFetch } from './ayudas.jsx';
import { confirmar, notificar } from '../src/shared/utils/notificaciones.js';

vi.mock('../src/shared/utils/notificaciones.js', () => ({
  confirmar: vi.fn(),
  notificar: { exito: vi.fn(), error: vi.fn(), atencion: vi.fn(), info: vi.fn() },
}));

const cuenta = (id, nombre, tipo, moneda, saldoInicial, saldoActual = saldoInicial) => ({
  id,
  nombre,
  tipo,
  moneda,
  saldoInicial,
  saldoActual,
});
const INICIALES = [
  cuenta('a1', 'Efectivo', 'efectivo', 'PEN', '50.00', '35.50'),
  cuenta('a2', 'Sueldo BCP', 'banco', 'PEN', '100.00', '1250.50'),
  cuenta('a3', 'Visa', 'tarjeta_credito', 'USD', '0.00', '-80.00'),
];
const lista = (items) =>
  respuestaApi(200, { data: items, meta: { page: 1, limit: 100, total: items.length, totalPages: 1 } });
const cuerpoDe = (llamada) => JSON.parse(llamada[1].body);

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Abre /cuentas con un "servidor" simulado que guarda las cuentas en memoria. */
async function abrir({ inicial = INICIALES, rutas = {} } = {}) {
  let cuentas = [...inicial];
  const fetchSimulado = simularFetch(undefined, {
    rutas: {
      '/cuentas': async (opciones) => {
        if (opciones?.method === 'POST') {
          const datos = JSON.parse(opciones.body);
          const nueva = { id: `n${cuentas.length + 1}`, ...datos, saldoActual: datos.saldoInicial };
          cuentas = [...cuentas, nueva];
          return respuestaApi(201, { data: nueva });
        }
        return lista(cuentas);
      },
      ...rutas,
    },
  });
  await montarApp({ ruta: '/cuentas', escritorio: true });
  return { fetchSimulado, usuario: userEvent.setup() };
}

describe('HU-07 · listado de cuentas', () => {
  it('muestra nombre, tipo, moneda y saldo actual con su símbolo, y el menú tiene la opción', async () => {
    await abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Cuentas' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Cuentas' }).length).toBeGreaterThan(0);

    const filas = (await screen.findAllByRole('listitem')).filter((li) => li.textContent.includes('·'));
    expect(filas).toHaveLength(3);
    expect(screen.getByText('S/ 35.50')).toBeInTheDocument();
    expect(screen.getByText('S/ 1,250.50')).toBeInTheDocument();
    expect(screen.getByText('−$ 80.00')).toBeInTheDocument(); // saldo negativo con signo
    expect(screen.getByText('Tarjeta de crédito · USD')).toBeInTheDocument();
  });

  it('sin cuentas muestra un mensaje que invita a crear una', async () => {
    await abrir({ inicial: [] });
    expect(await screen.findByText(/Todavía no tienes cuentas/)).toBeInTheDocument();
  });

  it('un error de carga muestra el mensaje y permite reintentar', async () => {
    let falla = true;
    const { usuario } = await abrir({
      rutas: {
        '/cuentas': async () =>
          falla
            ? respuestaError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado. Inténtalo nuevamente.')
            : lista(INICIALES),
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado');
    falla = false;
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Sueldo BCP')).toBeInTheDocument();
  });
});

describe('HU-07 · HU-25 · crear', () => {
  async function abrirFormulario() {
    const entorno = await abrir();
    await screen.findByText('Sueldo BCP');
    await entorno.usuario.click(screen.getByRole('button', { name: 'Nueva cuenta' }));
    return { ...entorno, panel: within(screen.getByRole('dialog', { name: 'Nueva cuenta' })) };
  }

  it('Registro exitoso en otra moneda: envía nombre, tipo, moneda y saldo inicial, y la muestra con su saldo', async () => {
    const { fetchSimulado, usuario, panel } = await abrirFormulario();
    await usuario.type(panel.getByLabelText('Nombre'), '  Dólares ');
    await usuario.selectOptions(panel.getByLabelText('Tipo'), 'banco');
    await usuario.selectOptions(panel.getByLabelText('Moneda'), 'USD');
    await usuario.clear(panel.getByLabelText('Saldo inicial'));
    await usuario.type(panel.getByLabelText('Saldo inicial'), '200');
    await usuario.click(panel.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('La cuenta se creó'));
    const envio = llamadasA(fetchSimulado, '/cuentas').find(([, o]) => o?.method === 'POST');
    expect(cuerpoDe(envio)).toEqual({ nombre: 'Dólares', tipo: 'banco', moneda: 'USD', saldoInicial: '200.00' });
    expect(screen.getByText('$ 200.00')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Moneda no seleccionada: muestra "La moneda es obligatoria" y no llama a la API', async () => {
    const { fetchSimulado, usuario, panel } = await abrirFormulario();
    expect(panel.getByLabelText('Moneda')).toHaveValue('');
    await usuario.type(panel.getByLabelText('Nombre'), 'Sin moneda');
    await usuario.click(panel.getByRole('button', { name: 'Crear cuenta' }));

    expect(await panel.findByText('La moneda es obligatoria')).toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/cuentas').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });

  it('Nombre vacío: muestra "El nombre de la cuenta es obligatorio"', async () => {
    const { usuario, panel } = await abrirFormulario();
    await usuario.selectOptions(panel.getByLabelText('Moneda'), 'PEN');
    await usuario.click(panel.getByRole('button', { name: 'Crear cuenta' }));
    expect(await panel.findByText('El nombre de la cuenta es obligatorio')).toBeInTheDocument();
  });

  it('Nombre duplicado: muestra el mensaje exacto del servidor junto al nombre y conserva el panel', async () => {
    const { usuario } = await abrir({
      rutas: {
        '/cuentas': async (opciones) =>
          opciones?.method === 'POST'
            ? respuestaError(409, 'CONFLICT', 'Ya existe una cuenta con ese nombre')
            : lista(INICIALES),
      },
    });
    await screen.findByText('Sueldo BCP');
    await usuario.click(screen.getByRole('button', { name: 'Nueva cuenta' }));
    const panel = within(screen.getByRole('dialog'));
    await usuario.type(panel.getByLabelText('Nombre'), 'Visa');
    await usuario.selectOptions(panel.getByLabelText('Moneda'), 'USD');
    await usuario.click(panel.getByRole('button', { name: 'Crear cuenta' }));

    expect(await panel.findByText('Ya existe una cuenta con ese nombre')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Cancelar cierra el panel sin llamar a la API', async () => {
    const { fetchSimulado, usuario, panel } = await abrirFormulario();
    await usuario.click(panel.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/cuentas').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });
});

describe('HU-07 · HU-25 · editar', () => {
  const rutaEditar = (respuesta) => ({ '/cuentas/a2': async (opciones) => respuesta(opciones) });

  it('Corrección del saldo inicial: precarga los datos y muestra el saldo actual que devuelve el servidor', async () => {
    const { fetchSimulado, usuario } = await abrir({
      rutas: rutaEditar((opciones) =>
        respuestaApi(200, { data: { ...INICIALES[1], ...JSON.parse(opciones.body), saldoActual: '1270.50' } }),
      ),
    });
    await screen.findByText('Sueldo BCP');
    await usuario.click(screen.getByRole('button', { name: 'Editar Sueldo BCP' }));

    const panel = within(screen.getByRole('dialog', { name: 'Editar cuenta' }));
    expect(panel.getByLabelText('Nombre')).toHaveValue('Sueldo BCP');
    expect(panel.getByLabelText('Moneda')).toHaveValue('PEN');
    expect(panel.getByLabelText('Saldo inicial')).toHaveValue('100.00');

    await usuario.clear(panel.getByLabelText('Saldo inicial'));
    await usuario.type(panel.getByLabelText('Saldo inicial'), '120');
    await usuario.click(panel.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('La cuenta se actualizó'));
    const envio = llamadasA(fetchSimulado, '/cuentas/a2')[0];
    expect(envio[1].method).toBe('PATCH');
    expect(cuerpoDe(envio)).toMatchObject({ saldoInicial: '120.00', moneda: 'PEN' });
    expect(screen.getByText('S/ 1,270.50')).toBeInTheDocument();
  });

  it('Cambio de moneda impedido por movimientos: muestra el mensaje exacto junto a la moneda y no cambia la lista', async () => {
    const MENSAJE = 'No se puede cambiar la moneda de una cuenta con movimientos asociados';
    const { usuario } = await abrir({ rutas: rutaEditar(() => respuestaError(409, 'CONFLICT', MENSAJE)) });
    await screen.findByText('Sueldo BCP');
    await usuario.click(screen.getByRole('button', { name: 'Editar Sueldo BCP' }));
    const panel = within(screen.getByRole('dialog'));
    await usuario.selectOptions(panel.getByLabelText('Moneda'), 'USD');
    await usuario.click(panel.getByRole('button', { name: 'Guardar cambios' }));

    expect(await panel.findByText(MENSAJE)).toBeInTheDocument();
    expect(screen.getByText('Tarjeta de crédito · USD')).toBeInTheDocument();
    expect(screen.getByText('Cuenta bancaria · PEN')).toBeInTheDocument();
  });

  it('Edición con nombre duplicado: muestra el mensaje exacto junto al nombre', async () => {
    const { usuario } = await abrir({
      rutas: rutaEditar(() => respuestaError(409, 'CONFLICT', 'Ya existe una cuenta con ese nombre')),
    });
    await screen.findByText('Sueldo BCP');
    await usuario.click(screen.getByRole('button', { name: 'Editar Sueldo BCP' }));
    const panel = within(screen.getByRole('dialog'));
    await usuario.clear(panel.getByLabelText('Nombre'));
    await usuario.type(panel.getByLabelText('Nombre'), 'Visa');
    await usuario.click(panel.getByRole('button', { name: 'Guardar cambios' }));
    expect(await panel.findByText('Ya existe una cuenta con ese nombre')).toBeInTheDocument();
  });
});

describe('HU-07 · eliminar', () => {
  it('Eliminación exitosa: confirma, llama a la API, quita la fila y notifica', async () => {
    confirmar.mockResolvedValue(true);
    const { fetchSimulado, usuario } = await abrir({ rutas: { '/cuentas/a1': () => respuestaApi(204) } });
    await screen.findByText('Efectivo');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Efectivo' }));

    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ confirmar: 'Eliminar', peligro: true }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('La cuenta se eliminó'));
    expect(llamadasA(fetchSimulado, '/cuentas/a1')[0][1].method).toBe('DELETE');
    expect(screen.queryByText('Efectivo')).not.toBeInTheDocument();
  });

  it('Eliminación sin confirmar: no llama a la API y la cuenta se conserva', async () => {
    confirmar.mockResolvedValue(false);
    const { fetchSimulado, usuario } = await abrir();
    await screen.findByText('Efectivo');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Efectivo' }));
    expect(llamadasA(fetchSimulado, '/cuentas/a1')).toHaveLength(0);
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
  });

  it('Eliminación impedida por movimientos asociados: muestra el mensaje exacto y conserva la cuenta', async () => {
    confirmar.mockResolvedValue(true);
    const MENSAJE = 'No se puede eliminar una cuenta con movimientos asociados';
    const { usuario } = await abrir({
      rutas: { '/cuentas/a2': () => respuestaError(409, 'CONFLICT', MENSAJE) },
    });
    await screen.findByText('Sueldo BCP');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Sueldo BCP' }));

    await waitFor(() => expect(notificar.error).toHaveBeenCalledWith(MENSAJE));
    expect(screen.getByText('Sueldo BCP')).toBeInTheDocument();
    expect(notificar.exito).not.toHaveBeenCalled();
  });
});
