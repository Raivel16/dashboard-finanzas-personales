import { FormularioRestablecerContrasena } from '../components/FormularioRestablecerContrasena.jsx';
import { useRestablecerContrasena } from '../hooks/useRestablecerContrasena.js';

export function RestablecerContrasenaPage() {
  const restablecer = useRestablecerContrasena();
  return <FormularioRestablecerContrasena {...restablecer} />;
}
