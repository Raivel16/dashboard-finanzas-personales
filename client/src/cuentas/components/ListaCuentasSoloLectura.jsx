import { Aviso } from '../../shared/components/Aviso.jsx';
import { FilaCuenta } from './FilaCuenta.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

/** Cuentas de otra persona para la consulta de administración: sin botones de crear, editar ni eliminar. */
export function ListaCuentasSoloLectura({ estado, mensaje, cuentas }) {
  const t = useT();
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando cuentas…')}
      </p>
    );
  }
  if (estado === 'error') return <Aviso tipo="error">{mensaje}</Aviso>;
  if (cuentas.length === 0) {
    return (
      <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
        {t('Este usuario aún no tiene cuentas')}
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
