import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { FilaPresupuesto } from './FilaPresupuesto.jsx';

const BOTON_ICONO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-tinta-suave hover:bg-papel disabled:opacity-60';

/** Agrupa por moneda conservando el orden del servidor (el general primero en cada moneda). */
const porMoneda = (items) =>
  items.reduce((grupos, item) => {
    const grupo = grupos.find((g) => g.moneda === item.moneda);
    if (grupo) grupo.items.push(item);
    else grupos.push({ moneda: item.moneda, items: [item] });
    return grupos;
  }, []);

/** Presentación de "Presupuestos": los datos y las acciones llegan por props. */
export function ListaPresupuestos({
  estado,
  mensaje,
  items,
  categorias,
  periodo,
  esMesPasado,
  eliminando,
  cambiarPeriodo,
  alCrear,
  alEditar,
  alEliminar,
  reintentar,
}) {
  const nombreDe = (item) =>
    item.categoriaId
      ? (categorias.find((c) => c.id === item.categoriaId)?.nombre ?? 'Categoría')
      : 'Presupuesto general';

  const selectorMes = (
    <Campo
      id="presupuestos-mes"
      nombre="mes"
      etiqueta="Mes"
      tipo="month"
      valor={periodo}
      alCambiar={(evento) => cambiarPeriodo(evento.target.value)}
    />
  );

  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando presupuestos…
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        {selectorMes}
        <Boton variante="primario" onClick={alCrear}>
          <Plus aria-hidden="true" size={18} />
          Nuevo presupuesto
        </Boton>
      </div>
      {items.length === 0 ? (
        <div className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
          <p>No has definido un presupuesto para este mes</p>
          {!esMesPasado && (
            <Boton variante="primario" onClick={alCrear} className="mt-3">
              Definir presupuesto
            </Boton>
          )}
        </div>
      ) : (
        porMoneda(items).map((grupo) => (
          <section key={grupo.moneda} aria-labelledby={`presupuestos-${grupo.moneda}`} className="flex flex-col gap-2">
            <h3 id={`presupuestos-${grupo.moneda}`} className="text-lg font-semibold">
              Presupuestos en {grupo.moneda}
            </h3>
            <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
              {grupo.items.map((item) => (
                <FilaPresupuesto
                  key={item.id}
                  item={item}
                  nombre={nombreDe(item)}
                  acciones={
                    <div className="flex shrink-0">
                      {!esMesPasado && (
                        <button
                          type="button"
                          className={BOTON_ICONO}
                          aria-label={`Editar ${nombreDe(item)} en ${item.moneda}`}
                          onClick={() => alEditar(item)}
                        >
                          <Pencil aria-hidden="true" size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        className={BOTON_ICONO}
                        aria-label={`Eliminar ${nombreDe(item)} en ${item.moneda}`}
                        disabled={eliminando === item.id}
                        onClick={() => alEliminar(item)}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </div>
                  }
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
