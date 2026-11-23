// HU-06 y HU-24 · sección "Categorías" del cliente.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { llamadasA, montarApp, respuestaApi, respuestaError, simularFetch } from './ayudas.jsx';
import { confirmar, notificar } from '../src/shared/utils/notificaciones.js';

vi.mock('../src/shared/utils/notificaciones.js', () => ({
  confirmar: vi.fn(),
  notificar: { exito: vi.fn(), error: vi.fn(), atencion: vi.fn(), info: vi.fn() },
}));

const cat = (id, nombre, tipo, icono = 'circle-ellipsis') => ({ id, nombre, tipo, icono });
const PREDETERMINADAS = [
  cat('c1', 'Alimentación', 'gasto', 'utensils'),
  cat('c2', 'Transporte', 'gasto', 'bus'),
  cat('c3', 'Vivienda', 'gasto', 'house'),
  cat('c4', 'Sueldo', 'ingreso', 'wallet'),
  cat('c5', 'Ventas', 'ingreso', 'store'),
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

/** Abre /categorias con un "servidor" simulado que guarda las categorías en memoria. */
async function abrir({ inicial = PREDETERMINADAS, rutas = {}, ruta = '/categorias' } = {}) {
  let categorias = [...inicial];
  const fetchSimulado = simularFetch(undefined, {
    rutas: {
      '/categorias': async (opciones) => {
        if (opciones?.method === 'POST') {
          const nueva = { id: `n${categorias.length + 1}`, ...JSON.parse(opciones.body) };
          categorias = [...categorias, nueva];
          return respuestaApi(201, { data: nueva });
        }
        return lista(categorias);
      },
      ...rutas,
    },
  });
  await montarApp({ ruta, escritorio: true });
  return { fetchSimulado, usuario: userEvent.setup(), categorias: () => categorias };
}

const grupo = (nombre) => screen.getByRole('region', { name: nombre });

describe('HU-24 · categorías disponibles', () => {
  it('muestra las categorías agrupadas en gastos e ingresos, y el menú tiene la opción', async () => {
    await abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Categorías' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Categorías' }).length).toBeGreaterThan(0);

    await screen.findByRole('region', { name: 'Gastos' });
    const gastos = within(grupo('Gastos'));
    expect(gastos.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Alimentación',
      'Transporte',
      'Vivienda',
    ]);
    expect(within(grupo('Ingresos')).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Sueldo',
      'Ventas',
    ]);
  });

  it('un grupo vacío muestra un mensaje que invita a crear', async () => {
    await abrir({ inicial: [cat('c4', 'Sueldo', 'ingreso')] });
    expect(await screen.findByText(/Todavía no tienes categorías de gastos/)).toBeInTheDocument();
  });

  it('un error de carga muestra el mensaje y permite reintentar', async () => {
    let falla = true;
    const { usuario } = await abrir({
      rutas: {
        '/categorias': async () =>
          falla ? respuestaError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado. Inténtalo nuevamente.') : lista(PREDETERMINADAS),
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado');
    falla = false;
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Alimentación')).toBeInTheDocument();
  });
});

describe('HU-06 · crear', () => {
  it('Creación exitosa: envía nombre, tipo e ícono, la muestra en la lista y notifica', async () => {
    const { fetchSimulado, usuario } = await abrir();
    await screen.findByText('Alimentación');
    await usuario.click(screen.getByRole('button', { name: 'Nueva categoría' }));

    const panel = screen.getByRole('dialog', { name: 'Nueva categoría' });
    await usuario.type(within(panel).getByLabelText('Nombre'), '  Entretenimiento ');
    await usuario.click(within(panel).getByRole('radio', { name: 'Entradas' }));
    await usuario.click(within(panel).getByRole('button', { name: 'Crear categoría' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('La categoría se creó'));
    const envio = llamadasA(fetchSimulado, '/categorias').find(([, o]) => o?.method === 'POST');
    expect(cuerpoDe(envio)).toEqual({ nombre: 'Entretenimiento', tipo: 'gasto', icono: 'ticket' });
    expect(within(grupo('Gastos')).getByText('Entretenimiento')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('un ingreso se crea en el grupo de ingresos', async () => {
    const { usuario } = await abrir();
    await screen.findByText('Alimentación');
    await usuario.click(screen.getByRole('button', { name: 'Nueva categoría' }));
    const panel = screen.getByRole('dialog');
    await usuario.selectOptions(within(panel).getByLabelText('Tipo'), 'ingreso');
    await usuario.type(within(panel).getByLabelText('Nombre'), 'Alquileres');
    await usuario.click(within(panel).getByRole('button', { name: 'Crear categoría' }));
    await waitFor(() => expect(within(grupo('Ingresos')).getByText('Alquileres')).toBeInTheDocument());
  });

  it('Validación: un nombre demasiado corto muestra el mensaje y no llama a la API', async () => {
    const { fetchSimulado, usuario } = await abrir();
    await screen.findByText('Alimentación');
    await usuario.click(screen.getByRole('button', { name: 'Nueva categoría' }));
    const panel = screen.getByRole('dialog');
    await usuario.type(within(panel).getByLabelText('Nombre'), 'x');
    await usuario.click(within(panel).getByRole('button', { name: 'Crear categoría' }));

    expect(await within(panel).findByText('El nombre debe tener entre 2 y 50 caracteres')).toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/categorias').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });

  it('Creación rechazada por nombre duplicado: muestra el mensaje exacto junto al campo y conserva el panel', async () => {
    const { usuario } = await abrir({
      rutas: {
        '/categorias': async (opciones) =>
          opciones?.method === 'POST'
            ? respuestaError(409, 'CONFLICT', 'Ya existe una categoría con ese nombre')
            : lista(PREDETERMINADAS),
      },
    });
    await screen.findByText('Alimentación');
    await usuario.click(screen.getByRole('button', { name: 'Nueva categoría' }));
    const panel = screen.getByRole('dialog');
    await usuario.type(within(panel).getByLabelText('Nombre'), 'Transporte');
    await usuario.click(within(panel).getByRole('button', { name: 'Crear categoría' }));

    expect(await within(panel).findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Cancelar cierra el panel sin llamar a la API', async () => {
    const { fetchSimulado, usuario } = await abrir();
    await screen.findByText('Alimentación');
    await usuario.click(screen.getByRole('button', { name: 'Nueva categoría' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/categorias').filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
  });
});

describe('HU-06 · editar', () => {
  const rutaEditar = (respuesta) => ({
    '/categorias/c2': async (opciones) => respuesta(opciones),
  });

  it('Edición exitosa: precarga el nombre, muestra el tipo sin poder cambiarlo y actualiza la lista', async () => {
    const { fetchSimulado, usuario } = await abrir({
      rutas: rutaEditar((opciones) =>
        respuestaApi(200, { data: { ...PREDETERMINADAS[1], ...JSON.parse(opciones.body) } }),
      ),
    });
    await screen.findByText('Transporte');
    await usuario.click(screen.getByRole('button', { name: 'Editar Transporte' }));

    const panel = screen.getByRole('dialog', { name: 'Editar categoría' });
    expect(within(panel).getByLabelText('Nombre')).toHaveValue('Transporte');
    expect(within(panel).queryByLabelText('Tipo')).not.toBeInTheDocument();
    expect(within(panel).getByText(/El tipo de una categoría no se puede cambiar/)).toBeInTheDocument();

    await usuario.clear(within(panel).getByLabelText('Nombre'));
    await usuario.type(within(panel).getByLabelText('Nombre'), 'Movilidad');
    await usuario.click(within(panel).getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('La categoría se actualizó'));
    const envio = llamadasA(fetchSimulado, '/categorias/c2')[0];
    expect(envio[1].method).toBe('PATCH');
    expect(cuerpoDe(envio)).toEqual({ nombre: 'Movilidad', icono: 'bus' });
    expect(within(grupo('Gastos')).getByText('Movilidad')).toBeInTheDocument();
    expect(within(grupo('Gastos')).queryByText('Transporte')).not.toBeInTheDocument();
  });

  it('Edición con nombre duplicado: muestra el mensaje exacto y conserva el nombre en la lista', async () => {
    const { usuario } = await abrir({
      rutas: rutaEditar(() => respuestaError(409, 'CONFLICT', 'Ya existe una categoría con ese nombre')),
    });
    await screen.findByText('Transporte');
    await usuario.click(screen.getByRole('button', { name: 'Editar Transporte' }));
    const panel = screen.getByRole('dialog');
    await usuario.clear(within(panel).getByLabelText('Nombre'));
    await usuario.type(within(panel).getByLabelText('Nombre'), 'Vivienda');
    await usuario.click(within(panel).getByRole('button', { name: 'Guardar cambios' }));

    expect(await within(panel).findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument();
    expect(within(grupo('Gastos')).getByText('Transporte')).toBeInTheDocument();
  });
});

describe('HU-06 · eliminar', () => {
  it('Eliminación exitosa: confirma, llama a la API, quita la fila y notifica', async () => {
    confirmar.mockResolvedValue(true);
    const { fetchSimulado, usuario } = await abrir({
      rutas: { '/categorias/c5': () => respuestaApi(204) },
    });
    await screen.findByText('Ventas');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Ventas' }));

    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ confirmar: 'Eliminar', peligro: true }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('La categoría se eliminó'));
    expect(llamadasA(fetchSimulado, '/categorias/c5')[0][1].method).toBe('DELETE');
    expect(screen.queryByText('Ventas')).not.toBeInTheDocument();
  });

  it('Eliminación sin confirmar: no llama a la API y la categoría se conserva', async () => {
    confirmar.mockResolvedValue(false);
    const { fetchSimulado, usuario } = await abrir();
    await screen.findByText('Ventas');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Ventas' }));

    expect(confirmar).toHaveBeenCalled();
    expect(llamadasA(fetchSimulado, '/categorias/c5')).toHaveLength(0);
    expect(screen.getByText('Ventas')).toBeInTheDocument();
  });

  it('Eliminación impedida por movimientos asociados: muestra el mensaje exacto y conserva la categoría', async () => {
    confirmar.mockResolvedValue(true);
    const MENSAJE =
      'No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero';
    const { usuario } = await abrir({
      rutas: { '/categorias/c1': () => respuestaError(409, 'CONFLICT', MENSAJE) },
    });
    await screen.findByText('Alimentación');
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Alimentación' }));

    await waitFor(() => expect(notificar.error).toHaveBeenCalledWith(MENSAJE));
    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(notificar.exito).not.toHaveBeenCalled();
  });
});
