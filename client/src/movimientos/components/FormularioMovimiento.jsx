import { TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Selector } from '../../shared/components/Selector.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

const ETIQUETAS_TIPO = { [TIPOS_MOVIMIENTO.GASTO]: 'Gasto', [TIPOS_MOVIMIENTO.INGRESO]: 'Ingreso' };

/** Registrar o editar un movimiento: el monto va primero (en el celular abre el teclado numérico). */
export function FormularioMovimiento({
  formulario,
  errorGeneral,
  editando,
  hoy,
  cambiarTipo,
  categoriasDelTipo,
  cuentas,
  alCancelar,
}) {
  const t = useT();
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  const textoEnviar = editando ? t('Guardar cambios') : t('Registrar movimiento');
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Selector
        etiqueta={t('Tipo')}
        props={propsCampo('tipo')}
        onChange={cambiarTipo}
        opciones={Object.entries(ETIQUETAS_TIPO).map(([valor, texto]) => [valor, t(texto)])}
      />
      <Campo
        {...propsCampo('monto')}
        etiqueta={t('Monto')}
        inputMode="decimal"
        autoComplete="off"
        autoFocus
        placeholder="0.00"
      />
      <Selector
        etiqueta={t('Categoría')}
        props={propsCampo('categoriaId')}
        vacio={t('Selecciona una categoría')}
        opciones={categoriasDelTipo.map((c) => [c.id, c.nombre])}
      />
      <Selector
        etiqueta={t('Cuenta')}
        props={propsCampo('cuentaId')}
        vacio={t('Selecciona una cuenta')}
        opciones={cuentas.map((c) => [c.id, `${c.nombre} (${c.moneda})`])}
      />
      <Campo {...propsCampo('fecha')} etiqueta={t('Fecha')} tipo="date" max={hoy} />
      <Campo {...propsCampo('descripcion')} etiqueta={t('Descripción (opcional)')} maxLength={255} autoComplete="off" />
      <div className="flex gap-2">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {enviando ? t('Guardando…') : textoEnviar}
        </Boton>
        <Boton onClick={alCancelar}>{t('Cancelar')}</Boton>
      </div>
    </form>
  );
}
