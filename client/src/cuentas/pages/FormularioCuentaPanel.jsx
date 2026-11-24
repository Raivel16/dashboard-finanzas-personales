import { FormularioCuenta } from '../components/FormularioCuenta.jsx';
import { useFormularioCuenta } from '../hooks/useFormularioCuenta.js';

/** Conecta el formulario con su hook; se monta solo mientras el panel está abierto, así cada apertura empieza limpia. */
export function FormularioCuentaPanel({ panel, alGuardar, alCancelar }) {
  const formulario = useFormularioCuenta({ panel, alGuardar });
  return <FormularioCuenta {...formulario} alCancelar={alCancelar} />;
}
