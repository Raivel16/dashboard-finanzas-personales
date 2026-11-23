import { IconoCategoria } from './IconoCategoria.jsx';

/**
 * Un grupo (gastos o ingresos) de categorías. `acciones(categoria)` agrega los botones de cada fila;
 * sin él la lista es de solo lectura.
 */
export function GrupoCategorias({ id, titulo, categorias, vacio, acciones, nivel: Titulo = 'h2' }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <Titulo id={id} className="text-lg font-semibold">
        {titulo}
      </Titulo>
      {categorias.length === 0 ? (
        <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">{vacio}</p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
          {categorias.map((categoria) => (
            <li
              key={categoria.id}
              className="flex items-center gap-3 border-b border-filete px-4 py-2 last:border-b-0"
            >
              <IconoCategoria nombre={categoria.icono} tipo={categoria.tipo} />
              <span className="min-w-0 flex-1 truncate font-medium">{categoria.nombre}</span>
              {acciones?.(categoria)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
