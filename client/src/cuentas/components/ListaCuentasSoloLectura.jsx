import { Aviso } from '../../shared/components/Aviso.jsx';
import { FilaCuenta } from './FilaCuenta.jsx';

/** Cuentas de otra persona para la consulta de administración: sin botones de crear, editar ni eliminar. */
export function ListaCuentasSoloLectura({ estado, mensaje, cuentas }) {
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando cuentas…
      </p>
    );
  }
  if (estado === 'error') return <Aviso tipo="error">{mensaje}</Aviso>;
  if (cuentas.length === 0) {
    return (
      <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
        Este usuario aún no tiene cuentas
      </p>
    );
  }
  return (
    <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
      {cuentas.map((cuenta) => (
        <FilaCuenta key={cuenta.id} cuenta={cuenta} />
      ))}
    </ul>
  );
}
