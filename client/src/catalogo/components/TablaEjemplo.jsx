import { Monto } from '../../shared/components/Monto.jsx';
import { formatearFecha } from '../../shared/utils/formato.js';

/** Libro de ejemplo: cada fila muestra el saldo resultante y el pie lleva la doble raya contable. */
export function TablaEjemplo({ filas, moneda }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="sr-only">Movimientos de ejemplo con su saldo resultante</caption>
        <thead>
          <tr className="border-b border-filete text-[0.8125rem] text-tinta-suave">
            <th scope="col" className="py-2 pr-3 font-medium">
              Fecha
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Concepto
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Monto
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Saldo
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className="border-b border-filete">
              <td className="py-2 pr-3">{formatearFecha(fila.fecha)}</td>
              <td className="py-2 pr-3">{fila.concepto}</td>
              <td className="py-2 pr-3 text-right">
                <Monto valor={fila.monto} moneda={moneda} tipo={fila.tipo} />
              </td>
              <td className="py-2 text-right">
                <Monto valor={fila.saldo} moneda={moneda} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="doble-raya">
            <th scope="row" colSpan={3} className="py-2 pr-3 text-right font-semibold">
              Saldo final
            </th>
            <td className="py-2 text-right font-semibold">
              <Monto valor={filas.at(-1)?.saldo ?? '0'} moneda={moneda} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
