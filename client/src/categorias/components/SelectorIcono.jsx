import { ICONOS_CATEGORIA } from '@finanzas/shared';
import { ETIQUETAS_ICONO, ICONOS, ICONO_GENERICO } from '../iconos.js';

/** Selector de ícono: grupo de opciones (radio) navegable con teclado; cada opción tiene su nombre en español. */
export function SelectorIcono({ valor, alCambiar, error }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[0.8125rem] font-medium leading-[1.35] text-tinta-suave">Ícono</legend>
      <div className="grid grid-cols-6 gap-1">
        {ICONOS_CATEGORIA.map((nombre) => {
          const Icono = ICONOS[nombre] ?? ICONO_GENERICO;
          const marcado = valor === nombre;
          return (
            <label
              key={nombre}
              className={`relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-control border-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sello ${
                marcado ? 'border-sello bg-papel text-sello' : 'border-transparent text-tinta-suave hover:bg-papel'
              }`}
            >
              <input
                type="radio"
                name="icono"
                value={nombre}
                checked={marcado}
                onChange={alCambiar}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                aria-label={ETIQUETAS_ICONO[nombre] ?? nombre}
              />
              <Icono aria-hidden="true" size={22} />
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-gasto">
          {error}
        </p>
      )}
    </fieldset>
  );
}
