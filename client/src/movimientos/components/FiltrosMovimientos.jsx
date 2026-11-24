import { TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Selector } from '../../shared/components/Selector.jsx';

const ETIQUETAS_TIPO = { [TIPOS_MOVIMIENTO.GASTO]: 'Gasto', [TIPOS_MOVIMIENTO.INGRESO]: 'Ingreso' };

/** Filtros combinables del historial: rango de fechas, tipo, categoría y cuenta. */
export function FiltrosMovimientos({ filtros, categorias, cuentas }) {
  const { campo, rangoInvalido, aplicar, limpiar } = filtros;
  return (
    <form
      onSubmit={aplicar}
      noValidate
      aria-label="Filtros del historial"
      className="grid gap-3 rounded-superficie border border-filete bg-hoja p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <Campo {...campo('desde')} etiqueta="Desde" tipo="date" />
      <Campo {...campo('hasta')} etiqueta="Hasta" tipo="date" />
      <Selector
        etiqueta="Tipo"
        props={campo('tipo')}
        vacio="Todos"
        opciones={Object.entries(ETIQUETAS_TIPO)}
      />
      <Selector
        etiqueta="Categoría"
        props={campo('categoriaId')}
        vacio="Todas"
        opciones={categorias.map((c) => [c.id, c.nombre])}
      />
      <Selector
        etiqueta="Cuenta"
        props={campo('cuentaId')}
        vacio="Todas"
        opciones={cuentas.map((c) => [c.id, c.nombre])}
      />
      <div className="flex items-end gap-2">
        <Boton type="submit" variante="primario" disabled={rangoInvalido}>
          Aplicar filtros
        </Boton>
        <Boton onClick={limpiar}>Limpiar</Boton>
      </div>
    </form>
  );
}
