import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { FiltrosMovimientos } from './FiltrosMovimientos.jsx';
import { FilaMovimiento } from './FilaMovimiento.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

const BOTON_ICONO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-tinta-suave hover:bg-papel disabled:opacity-60';

const nombreDe = (lista, id) => lista.find((elemento) => elemento.id === id)?.nombre;

function EstadoVacio({ hayFiltros, sinCuentas, alCrear, limpiarFiltros }) {
  const t = useT();
  if (hayFiltros) {
    return (
      <>
        <p>{t('No se encontraron movimientos con los filtros seleccionados')}</p>
        <Boton onClick={limpiarFiltros} className="mt-3">
          {t('Limpiar filtros')}
        </Boton>
      </>
    );
  }
  if (sinCuentas) return <p>{t('Para registrar movimientos primero crea una cuenta en "Cuentas".')}</p>;
  return (
    <>
      <p>{t('Aún no tienes movimientos registrados')}</p>
      <Boton variante="primario" onClick={alCrear} className="mt-3">
        {t('Registrar el primer movimiento')}
      </Boton>
    </>
  );
}

/** Presentación del "Historial de movimientos": los datos y las acciones llegan por props. */
export function ListaMovimientos({
  estado,
  mensaje,
  movimientos,
  meta,
  cuentas,
  categorias,
  pagina,
  hayFiltros,
  formFiltros,
  eliminando,
  irAPagina,
  alCrear,
  alEditar,
  alEliminar,
  alVerDetalle,
  limpiarFiltros,
  reintentar,
}) {
  const t = useT();
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando movimientos…')}
      </p>
    );
  }
  if (estado === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <Aviso tipo="error">{mensaje}</Aviso>
        <Boton onClick={reintentar}>{t('Reintentar')}</Boton>
      </div>
    );
  }

  const vacio = (
    <EstadoVacio hayFiltros={hayFiltros} sinCuentas={cuentas.length === 0} alCrear={alCrear} limpiarFiltros={limpiarFiltros} />
  );

  return (
    <div className="flex flex-col gap-4">
      <Boton variante="primario" onClick={alCrear} className="self-start">
        <Plus aria-hidden="true" size={18} />
        {t('Nuevo movimiento')}
      </Boton>
      {(hayFiltros || movimientos.length > 0) && (
        <FiltrosMovimientos filtros={formFiltros} categorias={categorias} cuentas={cuentas} />
      )}
      {movimientos.length === 0 ? (
        <div className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">{vacio}</div>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
          {movimientos.map((movimiento) => (
            <FilaMovimiento
              key={movimiento.id}
              movimiento={movimiento}
              categoria={nombreDe(categorias, movimiento.categoriaId)}
              cuenta={nombreDe(cuentas, movimiento.cuentaId)}
              alVerDetalle={alVerDetalle}
              acciones={
                <div className="flex shrink-0">
                  <button
                    type="button"
                    className={BOTON_ICONO}
                    aria-label={t('Editar movimiento del {fecha} por {monto}', movimiento)}
                    onClick={() => alEditar(movimiento)}
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </button>
                  <button
                    type="button"
                    className={BOTON_ICONO}
                    aria-label={t('Eliminar movimiento del {fecha} por {monto}', movimiento)}
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
        <nav aria-label={t('Paginación')} className="flex items-center gap-3">
          <Boton onClick={() => irAPagina(pagina - 1)} disabled={pagina <= 1}>
            {t('Anterior')}
          </Boton>
          <span className="text-sm text-tinta-suave">
            {t('Página {pagina} de {total}', { pagina: meta.page, total: meta.totalPages })}
          </span>
          <Boton onClick={() => irAPagina(pagina + 1)} disabled={pagina >= meta.totalPages}>
            {t('Siguiente')}
          </Boton>
        </nav>
      )}
    </div>
  );
}
