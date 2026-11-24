import { formatearSaldo } from '../../shared/utils/formato.js';
import { ETIQUETAS_TIPO_CUENTA } from '../etiquetas.js';

/** Una cuenta en una lista: nombre, tipo y moneda, y su saldo actual. `acciones` agrega botones (vacío = solo lectura). */
export function FilaCuenta({ cuenta, acciones }) {
  return (
    <li className="flex items-center gap-3 border-b border-filete px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{cuenta.nombre}</p>
        <p className="text-sm text-tinta-suave">
          {ETIQUETAS_TIPO_CUENTA[cuenta.tipo]} · {cuenta.moneda}
        </p>
      </div>
      <p
        className={`shrink-0 font-semibold tabular-nums ${Number(cuenta.saldoActual) < 0 ? 'text-gasto' : ''}`}
        aria-label={`Saldo de ${cuenta.nombre}`}
      >
        {formatearSaldo(cuenta.saldoActual, cuenta.moneda)}
      </p>
      {acciones}
    </li>
  );
}
