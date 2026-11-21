const VARIANTES = {
  primario: 'bg-sello text-hoja border-sello hover:bg-sello-oscuro',
  secundario: 'bg-hoja text-tinta border-borde hover:bg-papel',
  peligro: 'bg-gasto text-hoja border-gasto hover:opacity-90',
};

/** Botón con área táctil mínima de 44 × 44 px. El violeta (primario) se reserva para la acción principal. */
export function Boton({ variante = 'secundario', type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control border px-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
