import { Monto } from '../../shared/components/Monto.jsx';
import { formatearFecha, formatearSaldo } from '../../shared/utils/formato.js';

/**
 * Un movimiento en una lista: descripción (o categoría), categoría y cuenta, fecha, monto con signo y, si lo trae,
 * el saldo que dejó en su cuenta. `acciones` agrega botones (vacío = solo lectura).
 */
export function FilaMovimiento({ movimiento, categoria, cuenta, acciones }) {
  return (
    <li className="flex items-center gap-3 border-b border-filete px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{movimiento.descripcion || categoria || 'Movimiento'}</p>
        <p className="truncate text-sm text-tinta-suave">
          {[categoria, cuenta].filter(Boolean).join(' · ')}
          {categoria || cuenta ? ' · ' : ''}
          {formatearFecha(movimiento.fecha)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <Monto valor={movimiento.monto} moneda={movimiento.moneda} tipo={movimiento.tipo} className="font-semibold" />
        {movimiento.saldoResultante !== undefined && (
          <p className="text-sm text-tinta-suave">
            Saldo {formatearSaldo(movimiento.saldoResultante, movimiento.moneda)}
          </p>
        )}
      </div>
      {acciones}
    </li>
  );
}
