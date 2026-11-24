import { Monto } from '../../shared/components/Monto.jsx';
import { formatearFecha, formatearSaldo } from '../../shared/utils/formato.js';

/**
 * Un movimiento en una lista: descripción (o categoría), categoría y cuenta, fecha, monto con signo y, si lo trae,
 * el saldo que dejó en su cuenta. `acciones` agrega botones (vacío = solo lectura) y `alVerDetalle` hace que la
 * parte de texto abra el detalle.
 */
export function FilaMovimiento({ movimiento, categoria, cuenta, acciones, alVerDetalle }) {
  const lugar = [categoria, cuenta, formatearFecha(movimiento.fecha)].filter(Boolean).join(' · ');
  const texto = (
    <>
      <span className="block truncate font-medium">{movimiento.descripcion || categoria || 'Movimiento'}</span>
      <span className="block truncate text-sm text-tinta-suave">{lugar}</span>
    </>
  );
  return (
    <li className="flex items-center gap-3 border-b border-filete px-4 py-3 last:border-b-0">
      {alVerDetalle ? (
        <button
          type="button"
          onClick={() => alVerDetalle(movimiento)}
          aria-label={`Ver detalle del movimiento del ${movimiento.fecha} por ${movimiento.monto}`}
          className="min-h-11 min-w-0 flex-1 rounded-control text-left"
        >
          {texto}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{texto}</div>
      )}
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
