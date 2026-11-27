import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../hooks/contextoSesion.js';
import { useT } from '../../shared/preferencias/traducir.js';

/** Deja pasar solo con sesión; sin ella lleva al inicio de sesión y recuerda a dónde se quería ir. */
export function RutaProtegida() {
  const t = useT();
  const { estado } = useSesion();
  const ubicacion = useLocation();
  if (estado === 'cargando') {
    return (
      <p role="status" className="p-6 text-tinta-suave">
        {t('Comprobando tu sesión…')}
      </p>
    );
  }
  if (estado !== 'autenticado') {
    return <Navigate to="/iniciar-sesion" replace state={{ desde: ubicacion.pathname }} />;
  }
  return <Outlet />;
}
