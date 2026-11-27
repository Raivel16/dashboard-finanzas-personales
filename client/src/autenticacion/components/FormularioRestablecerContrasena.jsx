import { MENSAJES } from '@finanzas/shared';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { EnlaceTexto } from './EnlaceTexto.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

export function FormularioRestablecerContrasena({ formulario, enlaceExpirado, errorGeneral }) {
  const t = useT();
  const { enviar, enviando, formularioRef, propsCampo } = formulario;

  if (enlaceExpirado) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-[650] leading-tight">{t('Enlace no disponible')}</h1>
        <Aviso tipo="error">{MENSAJES.auth.enlaceExpirado}</Aviso>
        <EnlaceTexto to="/olvide-contrasena">{t('Solicitar un enlace nuevo')}</EnlaceTexto>
      </div>
    );
  }

  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <h1 className="text-2xl font-[650] leading-tight">{t('Crea una contraseña nueva')}</h1>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo
        {...propsCampo('password')}
        etiqueta={t('Contraseña nueva')}
        tipo="password"
        autoComplete="new-password"
        ayuda={t('Mínimo 8 caracteres, con una mayúscula y un número.')}
      />
      <Boton type="submit" variante="primario" disabled={enviando}>
        {enviando ? t('Guardando…') : t('Guardar contraseña')}
      </Boton>
    </form>
  );
}
