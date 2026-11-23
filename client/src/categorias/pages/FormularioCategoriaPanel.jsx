import { FormularioCategoria } from '../components/FormularioCategoria.jsx';
import { useFormularioCategoria } from '../hooks/useFormularioCategoria.js';

/** Conecta el formulario con su hook; se monta solo mientras el panel está abierto, así cada apertura empieza limpia. */
export function FormularioCategoriaPanel({ panel, alGuardar, alCancelar }) {
  const formulario = useFormularioCategoria({ panel, alGuardar });
  return <FormularioCategoria {...formulario} alCancelar={alCancelar} />;
}
