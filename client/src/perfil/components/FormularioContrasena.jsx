import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';

export function FormularioContrasena({ formulario, errorGeneral }) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4">
      <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo
        {...propsCampo('passwordActual')}
        etiqueta="Contraseña actual"
        tipo="password"
        autoComplete="current-password"
      />
      <Campo
        {...propsCampo('passwordNueva')}
        etiqueta="Contraseña nueva"
        tipo="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres, con una mayúscula y un número. Se cerrarán tus demás sesiones."
      />
      <Campo
        {...propsCampo('confirmacion')}
        etiqueta="Confirmar contraseña nueva"
        tipo="password"
        autoComplete="new-password"
      />
      <Boton type="submit" variante="primario" disabled={enviando} className="self-start">
        {enviando ? 'Cambiando…' : 'Cambiar contraseña'}
      </Boton>
    </form>
  );
}
