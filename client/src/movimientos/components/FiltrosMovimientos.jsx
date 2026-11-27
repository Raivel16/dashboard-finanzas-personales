import { TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Selector } from '../../shared/components/Selector.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

const ETIQUETAS_TIPO = { [TIPOS_MOVIMIENTO.GASTO]: 'Gasto', [TIPOS_MOVIMIENTO.INGRESO]: 'Ingreso' };

/** Filtros combinables del historial: rango de fechas, tipo, categoría y cuenta. */
export function FiltrosMovimientos({ filtros, categorias, cuentas }) {
  const t = useT();
  const { campo, rangoInvalido, aplicar, limpiar } = filtros;
  return (
    <form
      onSubmit={aplicar}
      noValidate
      aria-label={t('Filtros del historial')}
      className="grid gap-3 rounded-superficie border border-filete bg-hoja p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <Campo {...campo('desde')} etiqueta={t('Desde')} tipo="date" />
      <Campo {...campo('hasta')} etiqueta={t('Hasta')} tipo="date" />
      <Selector
        etiqueta={t('Tipo')}
        props={campo('tipo')}
        vacio={t('Todos')}
        opciones={Object.entries(ETIQUETAS_TIPO).map(([valor, texto]) => [valor, t(texto)])}
      />
      <Selector
        etiqueta={t('Categoría')}
        props={campo('categoriaId')}
        vacio={t('Todas')}
        opciones={categorias.map((c) => [c.id, c.nombre])}
      />
      <Selector
        etiqueta={t('Cuenta')}
        props={campo('cuentaId')}
        vacio={t('Todas')}
        opciones={cuentas.map((c) => [c.id, c.nombre])}
      />
      <div className="flex items-end gap-2">
        <Boton type="submit" variante="primario" disabled={rangoInvalido}>
          {t('Aplicar filtros')}
        </Boton>
        <Boton onClick={limpiar}>{t('Limpiar')}</Boton>
      </div>
    </form>
  );
}
