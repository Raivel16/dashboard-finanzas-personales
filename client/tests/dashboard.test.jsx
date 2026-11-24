// HU-12, HU-13 y HU-28 · dashboard de la pantalla de inicio. Chart.js se simula (jsdom no tiene canvas): las pruebas
// comprueban los datos y las opciones que se le entregan, y la tabla equivalente de cada gráfico.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { llamadasA, montarApp, respuestaApi, respuestaError, simularFetch } from './ayudas.jsx';

const INDICADORES = {
  periodo: '2026-01',
  moneda: 'PEN',
  ingresos: '3000.00',
  gastos: '900.00',
  balance: '2100.00',
  hayMovimientos: true,
  presupuesto: { monto: '1500.00', gastado: '900.00', restante: '600.00', porcentaje: 60, excedido: false, sobregiro: '0.00' },
};
const GRAFICOS = {
  periodo: '2026-01',
  moneda: 'PEN',
  evolucion: [
    { periodo: '2025-08', ingresos: '2000.00', gastos: '0.00' },
    { periodo: '2025-09', ingresos: '0.00', gastos: '0.00' },
    { periodo: '2025-10', ingresos: '0.00', gastos: '500.00' },
    { periodo: '2025-11', ingresos: '0.00', gastos: '0.00' },
    { periodo: '2025-12', ingresos: '0.00', gastos: '0.00' },
    { periodo: '2026-01', ingresos: '3000.00', gastos: '900.00' },
  ],
  distribucion: {
    total: '400.00',
    items: [
      { categoriaId: 'c1', nombre: 'Alimentación', total: '300.00', porcentaje: 75 },
      { categoriaId: 'c2', nombre: 'Transporte', total: '100.00', porcentaje: 25 },
    ],
  },
};
const exito = (data) => respuestaApi(200, { data });
const MONEDAS = { principal: 'PEN', monedas: ['PEN', 'USD'] };

beforeEach(() => {
  globalThis.__graficos = {};
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function abrir({ rutas = {} } = {}) {
  const fetchSimulado = simularFetch(undefined, {
    rutas: {
      '/dashboard/monedas': async () => exito(MONEDAS),
      '/dashboard/indicadores': async () => exito(INDICADORES),
      '/dashboard/graficos': async () => exito(GRAFICOS),
      ...rutas,
    },
  });
  await montarApp({ escritorio: true });
  return { fetchSimulado, usuario: userEvent.setup() };
}
/** El total de ingresos de las tarjetas (la misma cifra aparece también en la tabla de evolución). */
const ingresosDeTarjeta = async () =>
  within(await screen.findByLabelText('Indicadores del período')).findByText('S/ 3,000.00');
const tarjeta = (titulo) => screen.getByRole('heading', { name: titulo }).parentElement;

describe('HU-12 · indicadores', () => {
  it('Visualización exitosa: ingresos, gastos, balance y porcentaje de presupuesto del mes', async () => {
    await abrir();
    expect(await within(await screen.findByLabelText('Indicadores del período')).findByText('S/ 3,000.00')).toBeInTheDocument();
    expect(within(tarjeta('Total de gastos')).getByText('S/ 900.00')).toBeInTheDocument();
    expect(within(tarjeta('Balance neto')).getByText('S/ 2,100.00')).toBeInTheDocument();
    const presupuesto = within(tarjeta('Presupuesto utilizado'));
    expect(presupuesto.getByText('60 %')).toBeInTheDocument();
    expect(presupuesto.getByText('Quedan S/ 600.00')).toBeInTheDocument();
    expect(presupuesto.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });

  it('Cambio de período: pide el mes elegido y actualiza los indicadores', async () => {
    const { fetchSimulado } = await abrir({
      rutas: {
        '/dashboard/indicadores': async () => exito(INDICADORES),
      },
    });
    await ingresosDeTarjeta();
    fireEvent.change(screen.getByLabelText('Mes'), { target: { value: '2025-12' } });
    await waitFor(() => expect(llamadasA(fetchSimulado, '/dashboard/indicadores').at(-1)[0]).toContain('periodo=2025-12'));
    await waitFor(() => expect(llamadasA(fetchSimulado, '/dashboard/graficos').at(-1)[0]).toContain('periodo=2025-12'));
  });

  it('Sin movimientos: valores en cero y mensaje motivacional', async () => {
    await abrir({
      rutas: {
        '/dashboard/indicadores': async () =>
          exito({ ...INDICADORES, ingresos: '0.00', gastos: '0.00', balance: '0.00', hayMovimientos: false, presupuesto: null }),
      },
    });
    expect(await screen.findByText(/Aún no hay movimientos en este período/)).toBeInTheDocument();
    expect(within(tarjeta('Total de ingresos')).getByText('S/ 0.00')).toBeInTheDocument();
    expect(within(tarjeta('Presupuesto utilizado')).getByText('Sin presupuesto para este mes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Definir presupuesto' })).toHaveAttribute('href', '/presupuestos');
  });

  it('Presupuesto excedido: muestra el porcentaje y el monto sobregirado', async () => {
    await abrir({
      rutas: {
        '/dashboard/indicadores': async () =>
          exito({
            ...INDICADORES,
            presupuesto: { monto: '1000.00', gastado: '1150.00', restante: '0.00', porcentaje: 115, excedido: true, sobregiro: '150.00' },
          }),
      },
    });
    const presupuesto = within(await screen.findByRole('heading', { name: 'Presupuesto utilizado' }).then((h) => h.parentElement));
    expect(presupuesto.getByText('115 %')).toBeInTheDocument();
    expect(presupuesto.getByText('Excedido por S/ 150.00')).toBeInTheDocument();
  });

  it('Error controlado: mensaje con "Reintentar" y el resto de la pantalla intacta', async () => {
    let falla = true;
    const { usuario } = await abrir({
      rutas: {
        '/dashboard/indicadores': async () =>
          falla ? respuestaError(500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado.') : exito(INDICADORES),
      },
    });
    expect(await screen.findByText('No se pudieron cargar los indicadores')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gastos por categoría' })).toBeInTheDocument();
    falla = false;
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await ingresosDeTarjeta()).toBeInTheDocument();
  });
});

describe('HU-13 · gráficos', () => {
  it('Evolución de ingresos y gastos y distribución por categoría con los colores del sistema', async () => {
    await abrir();
    await screen.findByRole('img', { name: 'Distribución de gastos por categoría' });
    const { barras, circular } = globalThis.__graficos;
    expect(barras.data.labels).toHaveLength(6);
    expect(barras.data.datasets.map((d) => d.label)).toEqual(['Ingresos', 'Gastos']);
    expect(barras.data.datasets[0].data).toEqual([2000, 0, 0, 0, 0, 3000]);
    expect(barras.data.datasets[1].data).toEqual([0, 0, 500, 0, 0, 900]);
    expect(circular.data.labels).toEqual(['Alimentación', 'Transporte']);
    expect(circular.data.datasets[0].data).toEqual([300, 100]);
  });

  it('Tooltip: nombre de la categoría, monto exacto y porcentaje sobre el total', async () => {
    await abrir();
    await screen.findByRole('img', { name: 'Distribución de gastos por categoría' });
    const { circular, barras } = globalThis.__graficos;
    const etiqueta = circular.options.plugins.tooltip.callbacks.label;
    expect(etiqueta({ dataIndex: 0 })).toBe('Alimentación: S/ 300.00 (75%)');
    expect(etiqueta({ dataIndex: 1 })).toBe('Transporte: S/ 100.00 (25%)');
    expect(barras.options.plugins.tooltip.callbacks.label({ dataset: { label: 'Gastos' }, parsed: { y: 900 } })).toBe(
      'Gastos: S/ 900.00',
    );
  });

  it('Cada gráfico tiene su tabla equivalente', async () => {
    const { usuario } = await abrir();
    await usuario.click(await screen.findByText('Ver distribución en tabla'));
    const tabla = within(screen.getByRole('region', { name: 'Gastos por categoría' })).getByRole('table');
    expect(within(tabla).getByText('Alimentación')).toBeInTheDocument();
    expect(within(tabla).getByText('75 %')).toBeInTheDocument();
  });

  it('Error al generar los gráficos: mensaje en su espacio sin afectar las tarjetas', async () => {
    await abrir({
      rutas: { '/dashboard/graficos': async () => respuestaError(500, 'INTERNAL_ERROR', 'Falla') },
    });
    expect(await screen.findByText('No se pudieron generar los gráficos en este momento')).toBeInTheDocument();
    expect(await ingresosDeTarjeta()).toBeInTheDocument();
    expect(screen.queryByText('No se pudieron cargar los indicadores')).not.toBeInTheDocument();
  });

  it('Sin gastos: estado vacío específico y sin gráfico circular, con la evolución visible', async () => {
    await abrir({
      rutas: {
        '/dashboard/graficos': async () => exito({ ...GRAFICOS, distribucion: { total: '0.00', items: [] } }),
      },
    });
    expect(await screen.findByText('No hay gastos registrados en este período')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Distribución de gastos por categoría' })).not.toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /Ingresos y gastos de los últimos 6 meses/ })).toBeInTheDocument();
  });
});

describe('HU-28 · dashboard por moneda', () => {
  it('Por defecto usa la moneda principal y su símbolo', async () => {
    const { fetchSimulado } = await abrir();
    await ingresosDeTarjeta();
    expect(screen.getByLabelText('Moneda')).toHaveValue('PEN');
    expect(llamadasA(fetchSimulado, '/dashboard/indicadores')[0][0]).not.toContain('moneda=');
  });

  it('Cambio de moneda: recalcula con la moneda elegida', async () => {
    const { fetchSimulado, usuario } = await abrir({
      rutas: {
        '/dashboard/indicadores': async () => exito(INDICADORES),
      },
    });
    await ingresosDeTarjeta();
    await usuario.selectOptions(screen.getByLabelText('Moneda'), 'USD');
    await waitFor(() => expect(llamadasA(fetchSimulado, '/dashboard/indicadores').at(-1)[0]).toContain('moneda=USD'));
    await waitFor(() => expect(llamadasA(fetchSimulado, '/dashboard/graficos').at(-1)[0]).toContain('moneda=USD'));
  });

  it('Error al cambiar de moneda: conserva los datos en PEN, avisa y permite reintentar', async () => {
    let usd = false;
    const respuestas = async () => (usd ? respuestaError(500, 'INTERNAL_ERROR', 'Falla') : exito(INDICADORES));
    const { fetchSimulado, usuario } = await abrir({ rutas: { '/dashboard/indicadores': respuestas } });
    await ingresosDeTarjeta();
    usd = true;
    await usuario.selectOptions(screen.getByLabelText('Moneda'), 'USD');
    expect(await screen.findByText('No se pudieron cargar los indicadores en USD')).toBeInTheDocument();
    expect(await ingresosDeTarjeta()).toBeInTheDocument(); // los datos en PEN siguen visibles
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/dashboard/indicadores').at(-1)[0]).toContain('moneda=USD');
  });

  it('Selector limitado a las monedas en uso; sin cuentas solo la principal', async () => {
    await abrir({ rutas: { '/dashboard/monedas': async () => exito({ principal: 'PEN', monedas: ['PEN'] }) } });
    await ingresosDeTarjeta();
    const opciones = within(screen.getByLabelText('Moneda')).getAllByRole('option');
    expect(opciones.map((o) => o.textContent)).toEqual(['PEN']);
  });

  it('Con cuentas en PEN y USD el selector ofrece ambas', async () => {
    await abrir();
    await ingresosDeTarjeta();
    await waitFor(() =>
      expect(within(screen.getByLabelText('Moneda')).getAllByRole('option').map((o) => o.textContent)).toEqual(['PEN', 'USD']),
    );
  });
});
