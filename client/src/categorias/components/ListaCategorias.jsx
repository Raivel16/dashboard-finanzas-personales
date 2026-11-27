import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { GrupoCategorias } from './GrupoCategorias.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

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
  const t = useT();
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando categorías…')}
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

  const acciones = (categoria) => (
    <div className="flex shrink-0">
      <button
        type="button"
        className={BOTON_ICONO}
        aria-label={t('Editar {nombre}', categoria)}
        onClick={() => alEditar(categoria)}
      >
        <Pencil aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        className={BOTON_ICONO}
        aria-label={t('Eliminar {nombre}', categoria)}
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
        {t('Nueva categoría')}
      </Boton>
      <GrupoCategorias
        id="categorias-gastos"
        titulo={t('Gastos')}
        categorias={gastos}
        vacio={t('Todavía no tienes categorías de gastos. Crea una para clasificar tus movimientos.')}
        acciones={acciones}
      />
      <GrupoCategorias
        id="categorias-ingresos"
        titulo={t('Ingresos')}
        categorias={ingresos}
        vacio={t('Todavía no tienes categorías de ingresos. Crea una para clasificar tus movimientos.')}
        acciones={acciones}
      />
    </div>
  );
}
