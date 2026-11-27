import { CircleAlert } from 'lucide-react';
import { useT } from '../preferencias/traducir.js';

/**
 * Campo de formulario. Con error se marca con ícono y texto (no solo con color) y se anuncia a
 * los lectores de pantalla. Presentación pura: recibe valor, error y callbacks por props.
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

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.8125rem] font-medium leading-[1.35] text-tinta-suave">
        {etiqueta}
      </label>
      <input
        id={id}
        name={nombre}
        type={tipo}
        ref={inputRef}
        value={valor}
        onChange={alCambiar}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describe}
        className={`min-h-11 rounded-control border bg-hoja px-3 text-base text-tinta ${
          error ? 'border-gasto border-2' : 'border-borde'
        }`}
        {...props}
      />
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
