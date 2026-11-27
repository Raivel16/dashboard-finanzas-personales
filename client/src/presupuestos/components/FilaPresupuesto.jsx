import { CircleAlert } from 'lucide-react';
import { formatearMonto } from '../../shared/utils/formato.js';
import { BarraProgreso } from './BarraProgreso.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

/** Un presupuesto con su avance. `acciones` agrega botones (vacío = solo lectura). */
export function FilaPresupuesto({ item, nombre, acciones }) {
  const t = useT();
  const { moneda, monto, gastado, restante, porcentaje, excedido, sobregiro, sinAsignar } = item;
  const cerca = !excedido && porcentaje >= 90;
  return (
    <li className="flex flex-col gap-2 border-b border-filete px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{nombre}</p>
          <p className="font-mono text-sm tabular-nums text-tinta-suave">
            {t('{gastado} de {monto}', { gastado: formatearMonto(gastado, moneda), monto: formatearMonto(monto, moneda) })}
          </p>
        </div>
        {acciones}
      </div>
      <BarraProgreso porcentaje={porcentaje} excedido={excedido} etiqueta={t('{nombre}: {porcentaje}% utilizado', { nombre, porcentaje })} />
      <p className={`flex items-center gap-1.5 text-sm ${excedido ? 'font-medium text-gasto' : 'text-tinta-suave'}`}>
        {(excedido || cerca) && <CircleAlert aria-hidden="true" size={16} className="shrink-0" />}
        {excedido ? (
          <span>
            {t('{porcentaje} % utilizado · Excedido por {monto}', { porcentaje, monto: formatearMonto(sobregiro, moneda) })}
          </span>
        ) : (
          <span>
            {t('{porcentaje} % utilizado · Quedan {monto}', { porcentaje, monto: formatearMonto(restante, moneda) })}
            {cerca && ` · ${t('Cerca del límite')}`}
          </span>
        )}
      </p>
      {sinAsignar !== undefined && (
        <p className="text-sm text-tinta-suave">{t('Sin asignar a categorías')}: {formatearMonto(sinAsignar, moneda)}</p>
      )}
    </li>
  );
}
