import { Aviso } from '../../shared/components/Aviso.jsx';
import { formatearMonto } from '../../shared/utils/formato.js';
import { useT } from '../../shared/preferencias/traducir.js';

/**
 * Presupuestos de otra persona para la consulta de administración: sin botones de crear, editar ni eliminar.
 * `categorias` (de la misma persona) solo sirve para mostrar sus nombres.
 */
export function ListaPresupuestosSoloLectura({ estado, mensaje, presupuestos, categorias = [] }) {
  const t = useT();
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando presupuestos…')}
      </p>
    );
  }
  if (estado === 'error') return <Aviso tipo="error">{mensaje}</Aviso>;
  if (presupuestos.length === 0) {
    return (
      <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
        {t('Este usuario aún no tiene presupuestos')}
      </p>
    );
  }
  return (
    <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
      {presupuestos.map((presupuesto) => (
        <li
          key={presupuesto.id}
          className="flex items-center justify-between gap-3 border-b border-filete px-4 py-3 last:border-b-0"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">
              {presupuesto.categoriaId
                ? (categorias.find((c) => c.id === presupuesto.categoriaId)?.nombre ?? t('Categoría'))
                : t('Presupuesto general')}
            </p>
            <p className="text-sm text-tinta-suave">{presupuesto.periodo}</p>
          </div>
          <span className="font-mono tabular-nums">{formatearMonto(presupuesto.monto, presupuesto.moneda)}</span>
        </li>
      ))}
    </ul>
  );
}
