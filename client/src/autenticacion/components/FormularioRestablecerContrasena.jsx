import { MENSAJES } from '@finanzas/shared';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { EnlaceTexto } from './EnlaceTexto.jsx';

export function FormularioRestablecerContrasena({ formulario, enlaceExpirado, errorGeneral }) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;

  if (enlaceExpirado) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-[650] leading-tight">Enlace no disponible</h1>
        <Aviso tipo="error">{MENSAJES.auth.enlaceExpirado}</Aviso>
        <EnlaceTexto to="/olvide-contrasena">Solicitar un enlace nuevo</EnlaceTexto>
      </div>
    );
  }

  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-[650] leading-tight">Crea una contraseña nueva</h1>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo
        {...propsCampo('password')}
        etiqueta="Contraseña nueva"
        tipo="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres, con una mayúscula y un número."
      />
      <Boton type="submit" variante="primario" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar contraseña'}
      </Boton>
    </form>
  );
}
