import { MENSAJES, TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { SelectorIcono } from './SelectorIcono.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

const ETIQUETAS_TIPO = { [TIPOS_MOVIMIENTO.GASTO]: 'Gasto', [TIPOS_MOVIMIENTO.INGRESO]: 'Ingreso' };

/** Crear o editar una categoría. Al editar, el tipo se muestra pero no se puede cambiar. */
export function FormularioCategoria({ formulario, errorGeneral, editando, tipo, alCancelar }) {
  const t = useT();
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  const tipoCampo = propsCampo('tipo');
  const icono = propsCampo('icono');

  let textoBoton = t('Crear categoría');
  if (editando) textoBoton = t('Guardar cambios');
  if (enviando) textoBoton = t('Guardando…');
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

      {editando ? (
        <p className="text-sm text-tinta-suave">
          {t('Tipo')}: <strong className="text-tinta">{t(ETIQUETAS_TIPO[tipo])}</strong>.{' '}
          {t(MENSAJES.categoria.tipoNoEditable)}.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor={tipoCampo.id} className="text-[0.8125rem] font-medium leading-[1.35] text-tinta-suave">
            {t('Tipo')}
          </label>
          <select
            id={tipoCampo.id}
            name={tipoCampo.nombre}
            value={tipoCampo.valor}
            onChange={tipoCampo.alCambiar}
            className="min-h-11 rounded-control border border-borde bg-hoja px-3 text-base text-tinta"
          >
            {Object.entries(ETIQUETAS_TIPO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {t(etiqueta)}
              </option>
            ))}
          </select>
        </div>
      )}

      <Campo {...propsCampo('nombre')} etiqueta={t('Nombre')} maxLength={50} autoComplete="off" />
      <SelectorIcono
        valor={icono.valor}
        error={icono.error}
        alCambiar={(evento) => icono.alCambiar(evento)}
      />

      <div className="flex gap-2">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {textoBoton}
        </Boton>
        <Boton onClick={alCancelar}>{t('Cancelar')}</Boton>
      </div>
    </form>
  );
}
