import { useState } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useT } from '../preferencias/traducir.js';

/**
 * Campo de formulario. Con error se marca con ícono y texto (no solo con color) y se anuncia a
 * los lectores de pantalla. Presentación pura: recibe valor, error y callbacks por props; solo guarda si una
 * contraseña se está mostrando, que es estado visual del propio campo (HU-33).
 */
export function Campo({
  id,
  nombre,
  etiqueta,
  valor,
  alCambiar,
  error,
  ayuda,
  tipo = 'text',
  inputRef,
  ...props
}) {
  const t = useT();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const describe = [error && idError, ayuda && idAyuda].filter(Boolean).join(' ') || undefined;
  const esContrasena = tipo === 'password';
  const [contrasenaVisible, setContrasenaVisible] = useState(false);

  const entrada = (
    <input
      id={id}
      name={nombre}
      type={esContrasena && contrasenaVisible ? 'text' : tipo}
      ref={inputRef}
      value={valor}
      onChange={alCambiar}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describe}
      className={`min-h-11 rounded-control border bg-hoja px-3 text-base text-tinta ${
        error ? 'border-gasto border-2' : 'border-borde'
      } ${esContrasena ? 'w-full pr-12' : ''}`}
      {...props}
    />
  );

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.8125rem] font-medium leading-[1.35] text-tinta-suave">
        {etiqueta}
      </label>
      {esContrasena ? (
        <div className="relative">
          {entrada}
          <button
            type="button"
            onClick={() => setContrasenaVisible((visible) => !visible)}
            aria-label={t('Mostrar contraseña')}
            aria-pressed={contrasenaVisible}
            aria-controls={id}
            className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center rounded-control text-tinta-suave hover:text-tinta"
          >
            {contrasenaVisible ? (
              <EyeOff aria-hidden="true" size={20} />
            ) : (
              <Eye aria-hidden="true" size={20} />
            )}
          </button>
        </div>
      ) : (
        entrada
      )}
      {ayuda && !error && (
        <p id={idAyuda} className="text-sm text-tinta-suave">
          {t(ayuda)}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-gasto">
          <CircleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
          <span>{t(error)}</span>
        </p>
      )}
    </div>
  );
}
