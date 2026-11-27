import { useT } from '../preferencias/traducir.js';

/**
 * Lista desplegable de formulario con el mismo trato de errores que <Campo>: se marca con texto y se anuncia.
 * `props` son los de `propsCampo(campo)`; `vacio` agrega una primera opción sin valor ("Selecciona…").
 */
export function Selector({ etiqueta, props, onChange = props.alCambiar, vacio, opciones }) {
  const t = useT();
  const idError = `${props.id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={props.id} className="text-[0.8125rem] font-medium leading-[1.35] text-tinta-suave">
        {etiqueta}
      </label>
      <select
        id={props.id}
        name={props.nombre}
        value={props.valor}
        onChange={onChange}
        aria-invalid={props.error ? 'true' : undefined}
        aria-describedby={props.error ? idError : undefined}
        className={`min-h-11 rounded-control border bg-hoja px-3 text-base text-tinta ${
          props.error ? 'border-gasto border-2' : 'border-borde'
        }`}
      >
        {vacio && <option value="">{vacio}</option>}
        {opciones.map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      {props.error && (
        <p id={idError} role="alert" className="text-sm font-medium text-gasto">
          {t(props.error)}
        </p>
      )}
    </div>
  );
}
