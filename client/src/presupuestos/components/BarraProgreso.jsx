const tono = (porcentaje, excedido) => {
  if (excedido) return 'bg-gasto';
  return porcentaje >= 90 ? 'bg-atencion' : 'bg-ingreso';
};

/** Barra del avance de un presupuesto: llena al límite y en rojo cuando se excede. El valor también va en texto. */
export function BarraProgreso({ porcentaje, excedido, etiqueta }) {
  const ancho = Math.min(100, Math.max(0, porcentaje));
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ancho}
      className="h-3 overflow-hidden rounded-full border border-filete bg-papel"
    >
      <div className={`h-full ${tono(porcentaje, excedido)}`} style={{ width: `${ancho}%` }} />
    </div>
  );
}
