import { MONEDAS, TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Selector } from '../../shared/components/Selector.jsx';
import { formatearMonto } from '../../shared/utils/formato.js';
import { useT } from '../../shared/preferencias/traducir.js';

/**
 * Definir o cambiar un presupuesto. Al crear: mes, moneda, categoría (vacía = general) y monto. Al editar solo se
 * cambia el monto: el mes, la moneda y la categoría identifican al presupuesto.
 */
export function FormularioPresupuesto({ formulario, errorGeneral, editando, categorias, presupuesto, alCancelar }) {
  const t = useT();
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  const deGasto = categorias.filter((c) => c.tipo === TIPOS_MOVIMIENTO.GASTO);
  const nombreCategoria = deGasto.find((c) => c.id === presupuesto?.categoriaId)?.nombre;

  let textoBoton = t('Guardar presupuesto');
  if (editando) textoBoton = t('Guardar cambios');
  if (enviando) textoBoton = t('Guardando…');
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      {editando ? (
        <p className="text-tinta-suave">
          {nombreCategoria ?? t('Presupuesto general')} · {presupuesto.periodo} · {presupuesto.moneda} · {t('actual')}{' '}
          {formatearMonto(presupuesto.monto, presupuesto.moneda)}
        </p>
      ) : (
        <>
          <Campo {...propsCampo('periodo')} etiqueta={t('Mes')} tipo="month" />
          <Selector
            etiqueta={t('Moneda')}
            vacio={t('Selecciona una moneda')}
            opciones={MONEDAS.map((m) => [m, m])}
            props={propsCampo('moneda')}
          />
          <Selector
            etiqueta={t('Categoría')}
            vacio={t('Presupuesto general (todas las categorías)')}
            opciones={deGasto.map((c) => [c.id, c.nombre])}
            props={propsCampo('categoriaId')}
          />
        </>
      )}
      <Campo {...propsCampo('monto')} etiqueta={t('Monto')} inputMode="decimal" autoComplete="off" />
      <div className="flex gap-2">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {textoBoton}
        </Boton>
        <Boton onClick={alCancelar}>{t('Cancelar')}</Boton>
      </div>
    </form>
  );
}
