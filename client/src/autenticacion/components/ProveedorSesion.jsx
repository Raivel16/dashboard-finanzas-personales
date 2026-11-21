import { ContextoSesion } from '../hooks/contextoSesion.js';
import { useEstadoSesion } from '../hooks/useEstadoSesion.js';

/** Da a toda la aplicación acceso a la sesión actual. */
export function ProveedorSesion({ children }) {
  const sesion = useEstadoSesion();
  return <ContextoSesion.Provider value={sesion}>{children}</ContextoSesion.Provider>;
}
