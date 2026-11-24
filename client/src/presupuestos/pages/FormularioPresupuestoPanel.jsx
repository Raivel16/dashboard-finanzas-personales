import { FormularioPresupuesto } from '../components/FormularioPresupuesto.jsx';
import { useFormularioPresupuesto } from '../hooks/useFormularioPresupuesto.js';

/** Conecta el formulario con su hook; se monta solo mientras el panel está abierto, así cada apertura empieza limpia. */
export function FormularioPresupuestoPanel({ panel, periodo, items, categorias, alGuardar, alCancelar }) {
  const formulario = useFormularioPresupuesto({ panel, periodo, items, alGuardar });
  return (
    <FormularioPresupuesto
      {...formulario}
      categorias={categorias}
      presupuesto={panel.presupuesto}
      alCancelar={alCancelar}
    />
  );
}
