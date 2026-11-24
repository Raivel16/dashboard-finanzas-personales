import { FormularioMovimiento } from '../components/FormularioMovimiento.jsx';
import { useFormularioMovimiento } from '../hooks/useFormularioMovimiento.js';

/** Conecta el formulario con su hook; se monta solo mientras el panel está abierto, así cada apertura empieza limpia. */
export function FormularioMovimientoPanel({ panel, cuentas, categorias, alGuardar, alCancelar }) {
  const formulario = useFormularioMovimiento({ panel, cuentas, categorias, alGuardar });
  return <FormularioMovimiento {...formulario} alCancelar={alCancelar} />;
}
