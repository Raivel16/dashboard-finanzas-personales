import { Campo } from '../../shared/components/Campo.jsx';
import { Selector } from '../../shared/components/Selector.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

/** Mes y moneda del dashboard. El selector de moneda solo ofrece las monedas en uso. */
export function FiltrosDashboard({ periodo, moneda, monedas, alCambiarPeriodo, alCambiarMoneda }) {
  const t = useT();
  return (
    <form
      aria-label={t('Período y moneda')}
      onSubmit={(evento) => evento.preventDefault()}
      className="flex flex-wrap items-end gap-3"
    >
      <Campo
        id="dashboard-mes"
        nombre="mes"
        etiqueta={t('Mes')}
        tipo="month"
        valor={periodo}
        alCambiar={(evento) => alCambiarPeriodo(evento.target.value)}
      />
      <Selector
        etiqueta={t('Moneda')}
        opciones={monedas.map((m) => [m, m])}
        props={{
          id: 'dashboard-moneda',
          nombre: 'moneda',
          valor: moneda,
          alCambiar: (evento) => alCambiarMoneda(evento.target.value),
        }}
      />
    </form>
  );
}
