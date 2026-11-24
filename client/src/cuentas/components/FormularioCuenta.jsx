import { MONEDAS } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { ETIQUETAS_TIPO_CUENTA } from '../etiquetas.js';

function Selector({ etiqueta, opciones, vacio, props }) {
  const idError = `${props.id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={props.id} className="text-[0.8125rem] font-medium leading-[1.35] text-tinta-suave">
        {etiqueta}
      </label>
      <select
        id={props.id}
        name={props.nombre}
        value={props.valor}
        onChange={props.alCambiar}
        aria-invalid={props.error ? 'true' : undefined}
        aria-describedby={props.error ? idError : undefined}
        className={`min-h-11 rounded-control border bg-hoja px-3 text-base text-tinta ${
          props.error ? 'border-gasto border-2' : 'border-borde'
        }`}
      >
        {vacio && <option value="">{vacio}</option>}
        {opciones.map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      {props.error && (
        <p id={idError} role="alert" className="text-sm font-medium text-gasto">
          {props.error}
        </p>
      )}
    </div>
  );
}

/** Crear o editar una cuenta: nombre, tipo, moneda y saldo inicial. */
export function FormularioCuenta({ formulario, errorGeneral, editando, alCancelar }) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo {...propsCampo('nombre')} etiqueta="Nombre" maxLength={50} autoComplete="off" />
      <Selector etiqueta="Tipo" opciones={Object.entries(ETIQUETAS_TIPO_CUENTA)} props={propsCampo('tipo')} />
      <Selector
        etiqueta="Moneda"
        vacio="Selecciona una moneda"
        opciones={MONEDAS.map((m) => [m, m])}
        props={propsCampo('moneda')}
      />
      <Campo
        {...propsCampo('saldoInicial')}
        etiqueta="Saldo inicial"
        inputMode="decimal"
        autoComplete="off"
        ayuda={
          editando
            ? 'Si corriges el saldo inicial, el saldo actual cambia en la misma diferencia.'
            : 'Puede ser negativo, por ejemplo la deuda de una tarjeta.'
        }
      />
      <div className="flex gap-2">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cuenta'}
        </Boton>
        <Boton onClick={alCancelar}>Cancelar</Boton>
      </div>
    </form>
  );
}
