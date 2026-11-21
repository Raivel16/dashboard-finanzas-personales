import { usePrefiereMovimientoReducido } from '../hooks/useMediaQuery.js';

/** Sello violeta con el que queda "asentado" un movimiento. Sin animación si se prefiere menos movimiento. */
export function SelloAsentado() {
  const reducido = usePrefiereMovimientoReducido();
  return (
    <span
      role="status"
      data-animado={String(!reducido)}
      className={`inline-block -rotate-3 rounded-full border-2 border-sello px-3 py-0.5 text-sm font-semibold text-sello ${
        reducido ? '' : 'sello-animado'
      }`}
    >
      Asentado
    </span>
  );
}
