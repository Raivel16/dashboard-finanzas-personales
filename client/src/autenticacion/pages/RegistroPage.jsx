import { FormularioRegistro } from '../components/FormularioRegistro.jsx';
import { useRegistro } from '../hooks/useRegistro.js';

export function RegistroPage() {
  const { formulario, errorGeneral } = useRegistro();
  return <FormularioRegistro formulario={formulario} errorGeneral={errorGeneral} />;
}
