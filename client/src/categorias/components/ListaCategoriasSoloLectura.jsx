import { Aviso } from '../../shared/components/Aviso.jsx';
import { GrupoCategorias } from './GrupoCategorias.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

/** Categorías de otra persona para la consulta de administración: sin botones de crear, editar ni eliminar. */
export function ListaCategoriasSoloLectura({ estado, mensaje, gastos, ingresos }) {
  const t = useT();
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando categorías…')}
      </p>
    );
  }
  if (estado === 'error') return <Aviso tipo="error">{mensaje}</Aviso>;

  if (gastos.length === 0 && ingresos.length === 0) {
    return (
      <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
        {t('Este usuario aún no tiene categorías')}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <GrupoCategorias
        id="usuario-categorias-gastos"
        titulo={t('Gastos')}
        nivel="h4"
        categorias={gastos}
        vacio={t('Sin categorías de gastos')}
      />
      <GrupoCategorias
        id="usuario-categorias-ingresos"
        titulo={t('Ingresos')}
        nivel="h4"
        categorias={ingresos}
        vacio={t('Sin categorías de ingresos')}
      />
    </div>
  );
}
