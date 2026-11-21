import { FormularioOlvideContrasena } from '../components/FormularioOlvideContrasena.jsx';
import { useOlvideContrasena } from '../hooks/useOlvideContrasena.js';

export function OlvideContrasenaPage() {
  const recuperacion = useOlvideContrasena();
  return <FormularioOlvideContrasena {...recuperacion} />;
}
