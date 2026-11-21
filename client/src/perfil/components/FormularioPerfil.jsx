import { MONEDAS } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';

const NOMBRES_MONEDA = { PEN: 'PEN · Sol peruano', USD: 'USD · Dólar estadounidense', EUR: 'EUR · Euro' };

export function FormularioPerfil({ formulario, errorGeneral, correo, nota }) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  const moneda = propsCampo('monedaPrincipal');
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4">
      <h2 className="text-lg font-semibold">Mis datos</h2>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo {...propsCampo('nombre')} etiqueta="Nombre" autoComplete="name" />
      <Campo
        id="campo-correo"
        nombre="email"
        etiqueta="Correo electrónico"
        tipo="email"
        valor={correo}
        alCambiar={() => {}}
        readOnly
        ayuda={nota}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={moneda.id} className="text-[0.8125rem] font-medium leading-[1.35] text-tinta-suave">
          Moneda principal
        </label>
        <select
          id={moneda.id}
          name={moneda.nombre}
          value={moneda.valor}
          onChange={moneda.alCambiar}
          className="min-h-11 rounded-control border border-borde bg-hoja px-3 text-base text-tinta"
        >
          {MONEDAS.map((codigo) => (
            <option key={codigo} value={codigo}>
              {NOMBRES_MONEDA[codigo] ?? codigo}
            </option>
          ))}
        </select>
        <p className="text-sm text-tinta-suave">
          El dashboard se abrirá en esta moneda. Tus cuentas y movimientos no cambian.
        </p>
      </div>
      <Boton type="submit" variante="primario" disabled={enviando} className="self-start">
        {enviando ? 'Guardando…' : 'Guardar cambios'}
      </Boton>
    </form>
  );
}
