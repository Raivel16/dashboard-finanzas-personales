import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { GrupoCategorias } from './GrupoCategorias.jsx';

const BOTON_ICONO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-tinta-suave hover:bg-papel disabled:opacity-60';

/** Presentación de "Categorías": los datos y las acciones llegan por props. */
export function ListaCategorias({
  estado,
  mensaje,
  gastos,
  ingresos,
  eliminando,
  alCrear,
  alEditar,
  alEliminar,
  reintentar,
}) {
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando categorías…
      </p>
    );
  }
  if (estado === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <Aviso tipo="error">{mensaje}</Aviso>
        <Boton onClick={reintentar}>Reintentar</Boton>
      </div>
    );
  }

  const acciones = (categoria) => (
    <div className="flex shrink-0">
      <button
        type="button"
        className={BOTON_ICONO}
        aria-label={`Editar ${categoria.nombre}`}
        onClick={() => alEditar(categoria)}
      >
        <Pencil aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        className={BOTON_ICONO}
        aria-label={`Eliminar ${categoria.nombre}`}
        disabled={eliminando === categoria.id}
        onClick={() => alEliminar(categoria)}
      >
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <Boton variante="primario" onClick={alCrear} className="self-start">
        <Plus aria-hidden="true" size={18} />
        Nueva categoría
      </Boton>
      <GrupoCategorias
        id="categorias-gastos"
        titulo="Gastos"
        categorias={gastos}
        vacio="Todavía no tienes categorías de gastos. Crea una para clasificar tus movimientos."
        acciones={acciones}
      />
      <GrupoCategorias
        id="categorias-ingresos"
        titulo="Ingresos"
        categorias={ingresos}
        vacio="Todavía no tienes categorías de ingresos. Crea una para clasificar tus movimientos."
        acciones={acciones}
      />
    </div>
  );
}
