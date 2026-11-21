import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { EnlaceTexto } from './EnlaceTexto.jsx';

export function FormularioOlvideContrasena({ formulario, confirmacion, errorGeneral }) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;

  if (confirmacion) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-[650] leading-tight">Revisa tu correo</h1>
        <Aviso tipo="exito">{confirmacion}</Aviso>
        <p className="text-sm text-tinta-suave">El enlace vence en 30 minutos y solo sirve una vez.</p>
        <EnlaceTexto to="/iniciar-sesion">Volver a iniciar sesión</EnlaceTexto>
      </div>
    );
  }

  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-[650] leading-tight">¿Olvidaste tu contraseña?</h1>
      <p className="text-sm text-tinta-suave">
        Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
      </p>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo {...propsCampo('email')} etiqueta="Correo electrónico" tipo="email" autoComplete="email" />
      <Boton type="submit" variante="primario" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar enlace'}
      </Boton>
      <EnlaceTexto to="/iniciar-sesion">Volver a iniciar sesión</EnlaceTexto>
    </form>
  );
}
