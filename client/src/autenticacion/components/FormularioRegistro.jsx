import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { EnlaceTexto } from './EnlaceTexto.jsx';

export function FormularioRegistro({ formulario, errorGeneral }) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-[650] leading-tight">Crear cuenta</h1>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo {...propsCampo('nombre')} etiqueta="Nombre" autoComplete="name" />
      <Campo {...propsCampo('email')} etiqueta="Correo electrónico" tipo="email" autoComplete="email" />
      <Campo
        {...propsCampo('password')}
        etiqueta="Contraseña"
        tipo="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres, con una mayúscula y un número."
      />
      <Boton type="submit" variante="primario" disabled={enviando}>
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </Boton>
      <p className="text-sm text-tinta-suave">
        ¿Ya tienes cuenta? <EnlaceTexto to="/iniciar-sesion">Inicia sesión</EnlaceTexto>
      </p>
    </form>
  );
}
