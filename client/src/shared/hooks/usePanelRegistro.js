import { useCallback, useState } from 'react';

/** Estado abierto/cerrado del panel de registro (pantalla completa en celular, panel lateral en escritorio). */
export function usePanelRegistro() {
  const [abierto, setAbierto] = useState(false);
  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);
  return { abierto, abrir, cerrar };
}
