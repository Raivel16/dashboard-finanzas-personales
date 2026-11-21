import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { EnlaceTexto } from './EnlaceTexto.jsx';

export function FormularioInicioSesion({ formulario, errorGeneral, bloqueado, mensajeBloqueo, aviso }) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-[650] leading-tight">Iniciar sesión</h1>
      {aviso && <Aviso tipo="info">{aviso}</Aviso>}
      {bloqueado && <Aviso tipo="atencion">{mensajeBloqueo}</Aviso>}
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo {...propsCampo('email')} etiqueta="Correo electrónico" tipo="email" autoComplete="email" />
      <Campo
        {...propsCampo('password')}
        etiqueta="Contraseña"
        tipo="password"
        autoComplete="current-password"
      />
      <Boton type="submit" variante="primario" disabled={enviando || bloqueado}>
        {enviando ? 'Ingresando…' : 'Iniciar sesión'}
      </Boton>
      <div className="flex flex-col text-sm text-tinta-suave">
        <EnlaceTexto to="/olvide-contrasena">¿Olvidaste tu contraseña?</EnlaceTexto>
        <span>
          ¿Aún no tienes cuenta? <EnlaceTexto to="/registro">Regístrate</EnlaceTexto>
        </span>
      </div>
    </form>
  );
}
