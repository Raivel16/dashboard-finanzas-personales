import { Bar } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { formatearMonto } from '../../shared/utils/formato.js';
import { COLORES_GRAFICO } from '../../shared/utils/tokens.js';
import { TablaDatos } from './TablaDatos.jsx';
import { useT } from '../../shared/preferencias/traducir.js';
import { obtenerIdioma } from '../../shared/preferencias/preferencias.js';

const mesCorto = (periodo) => dayjs(`${periodo}-01`).locale(obtenerIdioma()).format('MMM YY');

/** Etiqueta del tooltip de una barra: serie y monto exacto con su moneda. */
export const etiquetaEvolucion = (moneda) => (contexto) =>
  `${contexto.dataset.label}: ${formatearMonto(contexto.parsed.y, moneda)}`;

/** Evolución de ingresos y gastos de los últimos meses (barras agrupadas), con su tabla equivalente. */
export function GraficoEvolucion({ evolucion, moneda }) {
  const t = useT();
  const datos = {
    labels: evolucion.map((m) => mesCorto(m.periodo)),
    datasets: [
      { label: t('Ingresos'), data: evolucion.map((m) => Number(m.ingresos)), backgroundColor: COLORES_GRAFICO.ingresos },
      { label: t('Gastos'), data: evolucion.map((m) => Number(m.gastos)), backgroundColor: COLORES_GRAFICO.gastos },
    ],
  };
  const opciones = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { callbacks: { label: etiquetaEvolucion(moneda) } } },
    scales: { y: { beginAtZero: true, ticks: { callback: (valor) => formatearMonto(valor, moneda) } } },
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="h-72">
        <Bar
          data={datos}
          options={opciones}
          role="img"
          aria-label={t('Ingresos y gastos de los últimos {cantidad} meses', { cantidad: evolucion.length })}
        />
      </div>
      <TablaDatos
        resumen={t('Ver evolución en tabla')}
        columnas={[t('Mes'), t('Ingresos'), t('Gastos')]}
        filas={evolucion.map((m) => [
          mesCorto(m.periodo),
          formatearMonto(m.ingresos, moneda),
          formatearMonto(m.gastos, moneda),
        ])}
      />
    </div>
  );
}
