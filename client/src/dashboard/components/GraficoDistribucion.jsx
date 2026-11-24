import { Doughnut } from 'react-chartjs-2';
import { MENSAJES } from '@finanzas/shared';
import { formatearMonto } from '../../shared/utils/formato.js';
import { colorDeCategoria } from '../../shared/utils/graficos.js';
import { COLORES_GRAFICO } from '../../shared/utils/tokens.js';
import { TablaDatos } from './TablaDatos.jsx';

/** Etiqueta del tooltip de un segmento: categoría, monto exacto y porcentaje sobre el total. */
export const etiquetaDistribucion = (items, moneda) => (contexto) => {
  const item = items[contexto.dataIndex];
  return `${item.nombre}: ${formatearMonto(item.total, moneda)} (${item.porcentaje}%)`;
};

/** Distribución de los gastos del mes por categoría (gráfico circular) con su tabla; sin gastos, un estado vacío. */
export function GraficoDistribucion({ distribucion, moneda }) {
  const { items } = distribucion;
  if (items.length === 0) {
    return (
      <p className="rounded-superficie border border-filete bg-papel p-4 text-tinta-suave">
        {MENSAJES.dashboard.sinGastos}
      </p>
    );
  }
  const datos = {
    labels: items.map((i) => i.nombre),
    datasets: [
      {
        data: items.map((i) => Number(i.total)),
        backgroundColor: items.map((i, indice) => (i.categoriaId ? colorDeCategoria(indice) : COLORES_GRAFICO.otras)),
      },
    ],
  };
  const opciones = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: etiquetaDistribucion(items, moneda) } },
    },
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="h-72">
        <Doughnut data={datos} options={opciones} role="img" aria-label="Distribución de gastos por categoría" />
      </div>
      <TablaDatos
        resumen="Ver distribución en tabla"
        columnas={['Categoría', 'Monto', 'Porcentaje']}
        filas={items.map((i) => [i.nombre, formatearMonto(i.total, moneda), `${i.porcentaje} %`])}
      />
    </div>
  );
}
