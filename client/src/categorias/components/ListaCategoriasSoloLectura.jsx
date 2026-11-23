import { Aviso } from '../../shared/components/Aviso.jsx';
import { GrupoCategorias } from './GrupoCategorias.jsx';

/** Categorías de otra persona para la consulta de administración: sin botones de crear, editar ni eliminar. */
export function ListaCategoriasSoloLectura({ estado, mensaje, gastos, ingresos }) {
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando categorías…
      </p>
    );
  }
  if (estado === 'error') return <Aviso tipo="error">{mensaje}</Aviso>;

  if (gastos.length === 0 && ingresos.length === 0) {
    return (
      <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
        Este usuario aún no tiene categorías
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <GrupoCategorias
        id="usuario-categorias-gastos"
        titulo="Gastos"
        nivel="h4"
        categorias={gastos}
        vacio="Sin categorías de gastos"
      />
      <GrupoCategorias
        id="usuario-categorias-ingresos"
        titulo="Ingresos"
        nivel="h4"
        categorias={ingresos}
        vacio="Sin categorías de ingresos"
      />
    </div>
  );
}
