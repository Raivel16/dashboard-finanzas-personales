// HU-16 · PDF, HU-17 · Excel y HU-31 · exportar el historial desde la sección "Movimientos".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fechaHoy } from '@finanzas/shared';
import { llamadasA, montarApp, respuestaApi, respuestaError, simularFetch } from './ayudas.jsx';
import { guardarArchivo } from '../src/shared/utils/descargas.js';

vi.mock('../src/shared/utils/descargas.js', () => ({ guardarArchivo: vi.fn() }));

const CUENTAS = [
  {
    id: '65f00000-0000-4000-8000-0000000000a1',
    nombre: 'Efectivo',
    tipo: 'efectivo',
    moneda: 'PEN',
    saldoInicial: '500.00',
    saldoActual: '460.00',
  },
];
const CATEGORIAS = [
  { id: '65f00000-0000-4000-8000-000000000001', nombre: 'Alimentación', tipo: 'gasto', icono: 'utensils' },
];
const GASTO = {
  id: 'm1',
  tipo: 'gasto',
  monto: '40.00',
  moneda: 'PEN',
  fecha: '2026-01-10',
  categoriaId: '65f00000-0000-4000-8000-000000000001',
  cuentaId: '65f00000-0000-4000-8000-0000000000a1',
  descripcion: 'Almuerzo',
  saldoResultante: '460.00',
};
const lista = (items) =>
  respuestaApi(200, { data: items, meta: { page: 1, limit: 20, total: items.length, totalPages: 1 } });

/** Respuesta de descarga: un archivo completo o uno que se corta al leerlo. */
const archivo = (nombre, { cortado = false } = {}) => ({
  ok: true,
  status: 200,
  headers: { get: () => `attachment; filename="${nombre}"` },
  blob: async () => {
    if (cortado) throw new TypeError('network error');
    return new Blob(['contenido']);
  },
});

/** `delMes`: movimientos que caen en el mes en curso (lo que cuenta la exportación sin rango de fechas). */
async function abrir({ movimientos = [GASTO], delMes = movimientos, rutas = {} } = {}) {
  const fetchSimulado = simularFetch(undefined, {
    rutas: {
      '/cuentas': async () => respuestaApi(200, { data: CUENTAS, meta: { page: 1, limit: 100, total: 1 } }),
      '/categorias': async () =>
        respuestaApi(200, { data: CATEGORIAS, meta: { page: 1, limit: 100, total: 1 } }),
      '/movimientos': async (_, url) => lista(url.includes('desde=') ? delMes : movimientos),
      ...rutas,
    },
  });
  await montarApp({ ruta: '/movimientos', escritorio: true });
  return { usuario: userEvent.setup(), fetchSimulado };
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HU-16 · exportar a PDF', () => {
  it('Exportación exitosa: pide el PDF con los filtros y descarga el archivo', async () => {
    const { usuario, fetchSimulado } = await abrir({
      rutas: { '/reportes/movimientos.pdf': async () => archivo('movimientos-2026-01.pdf') },
    });
    await screen.findByText('Almuerzo');
    await usuario.click(screen.getByRole('button', { name: 'Exportar a PDF' }));
    await waitFor(() => expect(guardarArchivo).toHaveBeenCalledTimes(1));
    expect(guardarArchivo.mock.calls[0][1]).toBe('movimientos-2026-01.pdf');
    const [[url]] = llamadasA(fetchSimulado, '/reportes/movimientos.pdf');
    expect(url).toContain(`desde=${fechaHoy().slice(0, 7)}-01`);
  });

  it('Período por defecto: sin rango de fechas avisa que se exporta el mes en curso y lo envía', async () => {
    await abrir();
    expect(await screen.findByText(/Sin un rango de fechas se exporta el mes en curso/)).toHaveTextContent(
      `(${fechaHoy().slice(0, 7)}-01 al`,
    );
  });

  it('Sin datos: deshabilita ambos botones y muestra "No hay datos disponibles para exportar"', async () => {
    await abrir({ movimientos: [] });
    expect(await screen.findByText('No hay datos disponibles para exportar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar a PDF' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Exportar a Excel' })).toBeDisabled();
  });

  it('Alto volumen: muestra el indicador de carga, avisa que continúa y descarga al terminar', async () => {
    let terminar;
    const { usuario } = await abrir({
      rutas: {
        '/reportes/movimientos.pdf': () =>
          new Promise((resolver) => (terminar = () => resolver(archivo('grande.pdf')))),
      },
    });
    await screen.findByText('Almuerzo');
    await usuario.click(screen.getByRole('button', { name: 'Exportar a PDF' }));
    expect(await screen.findByRole('button', { name: 'Generando…' })).toBeDisabled();
    expect(
      await screen.findByText(
        'Seguimos generando tu reporte; puedes seguir usando la aplicación',
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    terminar();
    await waitFor(() => expect(guardarArchivo).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Seguimos generando/)).not.toBeInTheDocument();
  }, 10000);
});

describe('HU-16 · HU-17 · sin datos en el período exportado', () => {
  it('Con movimientos solo de meses anteriores: el historial los muestra pero ambos botones se deshabilitan', async () => {
    await abrir({ movimientos: [GASTO], delMes: [] });
    await screen.findByText('Almuerzo');
    expect(await screen.findByText('No hay datos disponibles para exportar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar a PDF' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Exportar a Excel' })).toBeDisabled();
  });
});

describe('HU-17 · exportar a Excel', () => {
  it('Exportación exitosa: descarga el .xlsx', async () => {
    const { usuario } = await abrir({
      rutas: { '/reportes/movimientos.xlsx': async () => archivo('movimientos-2026-01.xlsx') },
    });
    await screen.findByText('Almuerzo');
    await usuario.click(screen.getByRole('button', { name: 'Exportar a Excel' }));
    await waitFor(() => expect(guardarArchivo).toHaveBeenCalledTimes(1));
    expect(guardarArchivo.mock.calls[0][1]).toBe('movimientos-2026-01.xlsx');
  });

  it('Conexión cortada a mitad de la descarga: muestra el error y no entrega ningún archivo', async () => {
    const { usuario } = await abrir({
      rutas: {
        '/reportes/movimientos.xlsx': async () => archivo('movimientos-2026-01.xlsx', { cortado: true }),
      },
    });
    await screen.findByText('Almuerzo');
    await usuario.click(screen.getByRole('button', { name: 'Exportar a Excel' }));
    expect(
      await screen.findByText('Ocurrió un error al generar el archivo. Intenta nuevamente'),
    ).toBeInTheDocument();
    expect(guardarArchivo).not.toHaveBeenCalled();
  });
});

describe('HU-31 · límite de movimientos', () => {
  it('Más de 5000: muestra el mensaje del servidor y no descarga nada', async () => {
    const mensaje = 'El reporte supera los 5000 movimientos. Reduce el período o aplica más filtros';
    const { usuario } = await abrir({
      rutas: { '/reportes/movimientos.xlsx': async () => respuestaError(400, 'VALIDATION_ERROR', mensaje) },
    });
    await screen.findByText('Almuerzo');
    await usuario.click(screen.getByRole('button', { name: 'Exportar a Excel' }));
    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(guardarArchivo).not.toHaveBeenCalled();
  });
});
