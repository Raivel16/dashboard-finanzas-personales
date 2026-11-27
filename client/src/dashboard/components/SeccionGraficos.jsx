import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { GraficoDistribucion } from './GraficoDistribucion.jsx';
import { GraficoEvolucion } from './GraficoEvolucion.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

function Tarjeta({ id, titulo, children }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-superficie border border-filete bg-hoja p-4">
      <h3 id={id} className="text-lg font-semibold">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/** Los dos gráficos del dashboard. Si fallan, el mensaje ocupa el lugar de los gráficos y no afecta a lo demás. */
export function SeccionGraficos({ estado, datos, mensaje, reintentar, moneda }) {
  const t = useT();
  if (!datos) {
    if (estado === 'error') {
      return (
        <div className="flex flex-col items-start gap-3">
          <Aviso tipo="error">{mensaje}</Aviso>
          <Boton onClick={reintentar}>{t('Reintentar')}</Boton>
        </div>
      );
    }
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando gráficos…')}
      </p>
    );
  }
  const monedaDeDatos = datos.moneda ?? moneda;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Tarjeta id="grafico-evolucion" titulo={t('Ingresos y gastos por mes')}>
        <GraficoEvolucion evolucion={datos.evolucion} moneda={monedaDeDatos} />
      </Tarjeta>
      <Tarjeta id="grafico-distribucion" titulo={t('Gastos por categoría')}>
        <GraficoDistribucion distribucion={datos.distribucion} moneda={monedaDeDatos} />
      </Tarjeta>
    </div>
  );
}
