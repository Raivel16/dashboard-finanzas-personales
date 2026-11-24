import { useState } from 'react';
import { MENSAJES } from '@finanzas/shared';

const VACIOS = { desde: '', hasta: '', tipo: '', categoriaId: '', cuentaId: '' };

/**
 * Borrador del formulario de filtros del historial: nada se consulta hasta pulsar "Aplicar filtros".
 * Con la fecha inicial posterior a la final se muestra el aviso y no se puede aplicar (HU-11).
 * @param {{ filtros: object, alAplicar: (filtros: object) => void, alLimpiar: () => void }} opciones
 */
export function useFiltrosMovimientos({ filtros, alAplicar, alLimpiar }) {
  const [borrador, setBorrador] = useState({ ...VACIOS, ...filtros });
  const rangoInvalido = Boolean(borrador.desde && borrador.hasta && borrador.desde > borrador.hasta);

  /** Props de un campo del formulario (mismo formato que `propsCampo` de useFormulario). */
  const campo = (nombre) => ({
    id: `filtro-${nombre}`,
    nombre,
    valor: borrador[nombre],
    error: nombre === 'hasta' && rangoInvalido ? MENSAJES.fecha.rango : undefined,
    alCambiar: (evento) => setBorrador((anterior) => ({ ...anterior, [nombre]: evento.target.value })),
  });

  const aplicar = (evento) => {
    evento?.preventDefault();
    if (rangoInvalido) return;
    alAplicar(Object.fromEntries(Object.entries(borrador).filter(([, valor]) => valor !== '')));
  };

  const limpiar = () => {
    setBorrador(VACIOS);
    alLimpiar();
  };

  return { campo, rangoInvalido, aplicar, limpiar };
}
