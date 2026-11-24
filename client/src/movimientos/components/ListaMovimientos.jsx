import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { FilaMovimiento } from './FilaMovimiento.jsx';

const BOTON_ICONO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-tinta-suave hover:bg-papel disabled:opacity-60';

const nombreDe = (lista, id) => lista.find((elemento) => elemento.id === id)?.nombre;

/** Presentación de "Movimientos": los datos y las acciones llegan por props. */
export function ListaMovimientos({
  estado,
  mensaje,
  movimientos,
  meta,
  cuentas,
  categorias,
  pagina,
  eliminando,
  irAPagina,
  alCrear,
  alEditar,
  alEliminar,
  reintentar,
}) {
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando movimientos…
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
      <Boton variante="primario" onClick={alCrear} className="self-start">
        <Plus aria-hidden="true" size={18} />
        Nuevo movimiento
      </Boton>
      {movimientos.length === 0 ? (
        <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
          {cuentas.length === 0
            ? 'Para registrar movimientos primero crea una cuenta en "Cuentas".'
            : 'Todavía no tienes movimientos. Registra el primero.'}
        </p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
          {movimientos.map((movimiento) => (
            <FilaMovimiento
              key={movimiento.id}
              movimiento={movimiento}
              categoria={nombreDe(categorias, movimiento.categoriaId)}
              cuenta={nombreDe(cuentas, movimiento.cuentaId)}
              acciones={
                <div className="flex shrink-0">
                  <button
                    type="button"
                    className={BOTON_ICONO}
                    aria-label={`Editar movimiento del ${movimiento.fecha} por ${movimiento.monto}`}
                    onClick={() => alEditar(movimiento)}
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </button>
                  <button
                    type="button"
                    className={BOTON_ICONO}
                    aria-label={`Eliminar movimiento del ${movimiento.fecha} por ${movimiento.monto}`}
                    disabled={eliminando === movimiento.id}
                    onClick={() => alEliminar(movimiento)}
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                </div>
              }
            />
          ))}
        </ul>
      )}
      {meta && meta.totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-3">
          <Boton onClick={() => irAPagina(pagina - 1)} disabled={pagina <= 1}>
            Anterior
          </Boton>
          <span className="text-sm text-tinta-suave">
            Página {meta.page} de {meta.totalPages}
          </span>
          <Boton onClick={() => irAPagina(pagina + 1)} disabled={pagina >= meta.totalPages}>
            Siguiente
          </Boton>
        </nav>
      )}
    </div>
  );
}
