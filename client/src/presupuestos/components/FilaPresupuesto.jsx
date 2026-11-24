import { CircleAlert } from 'lucide-react';
import { formatearMonto } from '../../shared/utils/formato.js';
import { BarraProgreso } from './BarraProgreso.jsx';

/** Un presupuesto con su avance. `acciones` agrega botones (vacío = solo lectura). */
export function FilaPresupuesto({ item, nombre, acciones }) {
  const { moneda, monto, gastado, restante, porcentaje, excedido, sobregiro, sinAsignar } = item;
  const cerca = !excedido && porcentaje >= 90;
  return (
    <li className="flex flex-col gap-2 border-b border-filete px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{nombre}</p>
          <p className="font-mono text-sm tabular-nums text-tinta-suave">
            {formatearMonto(gastado, moneda)} de {formatearMonto(monto, moneda)}
          </p>
        </div>
        {acciones}
      </div>
      <BarraProgreso porcentaje={porcentaje} excedido={excedido} etiqueta={`${nombre}: ${porcentaje}% utilizado`} />
      <p className={`flex items-center gap-1.5 text-sm ${excedido ? 'font-medium text-gasto' : 'text-tinta-suave'}`}>
        {(excedido || cerca) && <CircleAlert aria-hidden="true" size={16} className="shrink-0" />}
        {excedido ? (
          <span>
            {porcentaje} % utilizado · Excedido por {formatearMonto(sobregiro, moneda)}
          </span>
        ) : (
          <span>
            {porcentaje} % utilizado · Quedan {formatearMonto(restante, moneda)}
            {cerca && ' · Cerca del límite'}
          </span>
        )}
      </p>
      {sinAsignar !== undefined && (
        <p className="text-sm text-tinta-suave">Sin asignar a categorías: {formatearMonto(sinAsignar, moneda)}</p>
      )}
    </li>
  );
}
