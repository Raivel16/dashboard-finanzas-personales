import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

export function FormularioContrasena({ formulario, errorGeneral }) {
  const t = useT();
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('Cambiar contraseña')}</h2>
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Campo
        {...propsCampo('passwordActual')}
        etiqueta={t('Contraseña actual')}
        tipo="password"
        autoComplete="current-password"
      />
      <Campo
        {...propsCampo('passwordNueva')}
        etiqueta={t('Contraseña nueva')}
        tipo="password"
        autoComplete="new-password"
        ayuda={t('Mínimo 8 caracteres, con una mayúscula y un número. Se cerrarán tus demás sesiones.')}
      />
      <Campo
        {...propsCampo('confirmacion')}
        etiqueta={t('Confirmar contraseña nueva')}
        tipo="password"
        autoComplete="new-password"
      />
      <Boton type="submit" variante="primario" disabled={enviando} className="self-start">
        {enviando ? t('Cambiando…') : t('Cambiar contraseña')}
      </Boton>
    </form>
  );
}
