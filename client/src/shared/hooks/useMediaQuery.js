import { useCallback, useSyncExternalStore } from 'react';

/** true mientras la consulta CSS (p. ej. "(min-width: 1024px)") coincide con la pantalla. */
export function useMediaQuery(consulta) {
  const suscribir = useCallback(
    (alCambiar) => {
      const lista = window.matchMedia(consulta);
      lista.addEventListener('change', alCambiar);
      return () => lista.removeEventListener('change', alCambiar);
    },
    [consulta],
  );
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}

/** Escritorio desde 1024 px (barra lateral y panel de registro lateral). */
export const useEsEscritorio = () => useMediaQuery('(min-width: 1024px)');

/** La persona pidió menos movimiento: el sello "Asentado" aparece sin animación. */
export const usePrefiereMovimientoReducido = () => useMediaQuery('(prefers-reduced-motion: reduce)');
