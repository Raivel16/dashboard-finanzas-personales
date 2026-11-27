import { Navigate, Outlet } from 'react-router-dom';
import { useSesion } from '../hooks/contextoSesion.js';
import { useT } from '../../shared/preferencias/traducir.js';

/** Pantallas sin sesión: quien ya la tiene va directo al inicio. */
export function RutaPublica() {
  const t = useT();
  const { estado } = useSesion();
  if (estado === 'cargando') {
    return (
      <p role="status" className="p-6 text-tinta-suave">
        {t('Comprobando tu sesión…')}
      </p>
    );
  }
  if (estado === 'autenticado') return <Navigate to="/" replace />;
  return <Outlet />;
}
