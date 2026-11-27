import { Languages } from 'lucide-react';

const OPCIONES = [
  ['es', 'Español'],
  ['en', 'English'],
];

/**
 * Selector de idioma (HU-32). Cada opción se nombra en su propio idioma y lleva `lang` para que el lector de
 * pantalla la pronuncie bien. Presentación pura: el idioma y el cambio llegan por props.
 */
export function SelectorIdioma({ idioma, alCambiar, id = 'selector-idioma' }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-suave">
        <Languages aria-hidden="true" size={18} />
        <span lang="es">Idioma</span> / <span lang="en">Language</span>
      </label>
      <select
        id={id}
        value={idioma}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="min-h-11 rounded-control border border-borde bg-hoja px-3 text-base text-tinta"
      >
        {OPCIONES.map(([valor, nombre]) => (
          <option key={valor} value={valor} lang={valor}>
            {nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
