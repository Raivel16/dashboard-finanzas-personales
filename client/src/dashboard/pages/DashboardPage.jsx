import { FiltrosDashboard } from '../components/FiltrosDashboard.jsx';
import { SeccionGraficos } from '../components/SeccionGraficos.jsx';
import { TarjetasIndicadores } from '../components/TarjetasIndicadores.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { useT } from '../../shared/preferencias/traducir.js';

/** Indicadores y gráficos del mes y la moneda elegidos. */
export function DashboardPage() {
  const t = useT();
  const dashboard = useDashboard();
  return (
    <section aria-labelledby="dashboard-titulo" className="flex flex-col gap-4">
      <h2 id="dashboard-titulo" className="text-xl font-semibold">
        {t('Resumen financiero')}
      </h2>
      <FiltrosDashboard
        periodo={dashboard.periodo}
        moneda={dashboard.moneda}
        monedas={dashboard.monedas}
        alCambiarPeriodo={dashboard.cambiarPeriodo}
        alCambiarMoneda={dashboard.cambiarMoneda}
      />
      <TarjetasIndicadores {...dashboard.indicadores} />
      <SeccionGraficos {...dashboard.graficos} moneda={dashboard.moneda} />
    </section>
  );
}
