import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { EnlaceTexto } from './EnlaceTexto.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

export function FormularioRegistro({ formulario, errorGeneral }) {
  const t = useT();
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-[650] leading-tight">{t('Crear cuenta')}</h1>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo {...propsCampo('nombre')} etiqueta={t('Nombre')} autoComplete="name" />
      <Campo {...propsCampo('email')} etiqueta={t('Correo electrónico')} tipo="email" autoComplete="email" />
      <Campo
        {...propsCampo('password')}
        etiqueta={t('Contraseña')}
        tipo="password"
        autoComplete="new-password"
        ayuda={t('Mínimo 8 caracteres, con una mayúscula y un número.')}
      />
      <Boton type="submit" variante="primario" disabled={enviando}>
        {enviando ? t('Creando cuenta…') : t('Crear cuenta')}
      </Boton>
      <p className="text-sm text-tinta-suave">
        {t('¿Ya tienes cuenta?')} <EnlaceTexto to="/iniciar-sesion">{t('Inicia sesión')}</EnlaceTexto>
      </p>
    </form>
  );
}
