import { ICONOS, ICONO_GENERICO } from '../iconos.js';

/** Ícono decorativo de una categoría: el nombre siempre va escrito al lado. */
export function IconoCategoria({ nombre, tipo, tamano = 20 }) {
  const Icono = ICONOS[nombre] ?? ICONO_GENERICO;
  const color = tipo === 'ingreso' ? 'bg-ingreso-fondo text-ingreso' : 'bg-gasto-fondo text-gasto';
  return (
    <span aria-hidden="true" className={`inline-flex size-10 shrink-0 items-center justify-center rounded-control ${color}`}>
      <Icono size={tamano} />
    </span>
  );
}
