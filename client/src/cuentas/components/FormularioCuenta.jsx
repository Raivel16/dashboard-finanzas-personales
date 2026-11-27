import { MONEDAS } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Selector } from '../../shared/components/Selector.jsx';
import { ETIQUETAS_TIPO_CUENTA } from '../etiquetas.js';
import { useT } from '../../shared/preferencias/traducir.js';

/** Crear o editar una cuenta: nombre, tipo, moneda y saldo inicial. */
export function FormularioCuenta({ formulario, errorGeneral, editando, alCancelar }) {
  const t = useT();
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo {...propsCampo('nombre')} etiqueta={t('Nombre')} maxLength={50} autoComplete="off" />
      <Selector
        etiqueta={t('Tipo')}
        opciones={Object.entries(ETIQUETAS_TIPO_CUENTA).map(([valor, texto]) => [valor, t(texto)])}
        props={propsCampo('tipo')}
      />
      <Selector
        etiqueta={t('Moneda')}
        vacio={t('Selecciona una moneda')}
        opciones={MONEDAS.map((m) => [m, m])}
        props={propsCampo('moneda')}
      />
      <Campo
        {...propsCampo('saldoInicial')}
        etiqueta={t('Saldo inicial')}
        inputMode="decimal"
        autoComplete="off"
        ayuda={
          editando
            ? t('Si corriges el saldo inicial, el saldo actual cambia en la misma diferencia.')
            : t('Puede ser negativo, por ejemplo la deuda de una tarjeta.')
        }
      />
      <div className="flex gap-2">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {enviando ? t('Guardando…') : editando ? t('Guardar cambios') : t('Crear cuenta')}
        </Boton>
        <Boton onClick={alCancelar}>{t('Cancelar')}</Boton>
      </div>
    </form>
  );
}
