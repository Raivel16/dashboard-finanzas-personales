import { FormularioInicioSesion } from '../components/FormularioInicioSesion.jsx';
import { useInicioSesion } from '../hooks/useInicioSesion.js';

export function InicioSesionPage() {
  const inicio = useInicioSesion();
  return <FormularioInicioSesion {...inicio} />;
}
