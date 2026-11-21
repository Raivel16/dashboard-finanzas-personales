import { formatearMonto, signoDe } from '../utils/formato.js';

const COLOR = { ingreso: 'text-ingreso', gasto: 'text-gasto', neutro: 'text-tinta' };
const NOMBRE = { ingreso: 'Ingreso', gasto: 'Gasto' };

/**
 * Cifra en tipografía monoespaciada, a la derecha, con dos decimales, su moneda y un signo visible.
 * Nunca depende solo del color: ingreso lleva "+" y gasto "−", y el texto oculto lo nombra.
 */
export function Monto({ valor, moneda, tipo = 'neutro', className = '' }) {
  return (
    <span className={`font-mono tabular-nums whitespace-nowrap text-right ${COLOR[tipo]} ${className}`}>
      {NOMBRE[tipo] && <span className="sr-only">{NOMBRE[tipo]}: </span>}
      <span aria-hidden={NOMBRE[tipo] ? 'true' : undefined}>{signoDe(tipo)}</span>{' '}
      {formatearMonto(valor, moneda)}
    </span>
  );
}
