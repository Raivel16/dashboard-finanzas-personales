import { Bar, Doughnut } from 'react-chartjs-2';
import { COLORES_GRAFICO } from '../../shared/utils/tokens.js';
import { colorDeCategoria } from '../../shared/utils/graficos.js';
import { formatearMonto } from '../../shared/utils/formato.js';

/**
 * Gráficos de ejemplo con leyenda y tabla equivalente: el significado nunca depende solo del color.
 * Presentación pura; los datos llegan por props.
 */
export function GraficosEjemplo({ meses, categorias, moneda }) {
  const serie = {
    labels: meses.map((m) => m.etiqueta),
    datasets: [
      { label: 'Ingresos', data: meses.map((m) => m.ingresos), backgroundColor: COLORES_GRAFICO.ingresos },
      { label: 'Gastos', data: meses.map((m) => m.gastos), backgroundColor: COLORES_GRAFICO.gastos },
    ],
  };
  const distribucion = {
    labels: categorias.map((c) => c.nombre),
    datasets: [
      {
        label: 'Gasto por categoría',
        data: categorias.map((c) => c.total),
        backgroundColor: categorias.map((_, i) => colorDeCategoria(i)),
      },
    ],
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <figure className="flex flex-col gap-3">
        <figcaption className="font-semibold">Ingresos y gastos por mes</figcaption>
        <div
          className="h-64"
          role="img"
          aria-label="Barras de ingresos y gastos por mes; los valores están en la tabla"
        >
          <Bar data={serie} options={{ maintainAspectRatio: false, animation: false }} />
        </div>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Ingresos y gastos por mes</caption>
          <thead>
            <tr className="border-b border-filete text-tinta-suave">
              <th scope="col" className="py-1 font-medium">
                Mes
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Ingresos
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Gastos
              </th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.etiqueta} className="border-b border-filete">
                <th scope="row" className="py-1 font-normal">
                  {m.etiqueta}
                </th>
                <td className="py-1 text-right font-mono">{formatearMonto(m.ingresos, moneda)}</td>
                <td className="py-1 text-right font-mono">{formatearMonto(m.gastos, moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>

      <figure className="flex flex-col gap-3">
        <figcaption className="font-semibold">Gasto por categoría</figcaption>
        <div
          className="h-64"
          role="img"
          aria-label="Distribución del gasto por categoría; los valores están en la tabla"
        >
          <Doughnut
            data={distribucion}
            options={{
              maintainAspectRatio: false,
              animation: false,
              plugins: { legend: { position: 'right' } },
            }}
          />
        </div>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Gasto por categoría</caption>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.nombre} className="border-b border-filete">
                <th scope="row" className="py-1 font-normal">
                  {c.nombre}
                </th>
                <td className="py-1 text-right font-mono">{formatearMonto(c.total, moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </div>
  );
}
