import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { SelloAsentado } from '../../shared/components/SelloAsentado.jsx';

/** Formulario de demostración: el monto va primero y abre el teclado numérico en el celular. */
export function FormularioDemo({ formulario, alCerrar }) {
  const { formularioRef, enviar, enviando, propsCampo, asentado } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Campo etiqueta="Monto" inputMode="decimal" autoComplete="off" {...propsCampo('saldoInicial')} />
      <Campo etiqueta="Nombre" autoComplete="off" {...propsCampo('nombre')} />
      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" variante="primario" disabled={enviando}>
          Asentar
        </Boton>
        <Boton onClick={alCerrar}>Cerrar</Boton>
        {asentado && <SelloAsentado />}
      </div>
    </form>
  );
}
