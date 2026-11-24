import { useCallback, useEffect, useState } from 'react';

/**
 * Carga de una consulta que depende de `parametros`. Conserva el último resultado bueno mientras llega el siguiente o
 * si el siguiente falla, para que un error al cambiar de mes o de moneda no borre lo que ya se mostraba.
 * `estado`: cargando | listo | error (de la consulta actual); `datos` y `deParametros` son los del último éxito.
 */
export function useCarga(cargar, parametros) {
  const clave = JSON.stringify(parametros);
  const [intento, setIntento] = useState(0);
  const [exito, setExito] = useState(null); // { clave, datos }
  const [fallo, setFallo] = useState(null); // { clave, intento }

  useEffect(() => {
    const control = new AbortController();
    cargar({ ...JSON.parse(clave), signal: control.signal })
      .then((datos) => setExito({ clave, datos }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setFallo({ clave, intento });
      });
    return () => control.abort();
  }, [cargar, clave, intento]);

  let estado = 'cargando';
  if (exito?.clave === clave) estado = 'listo';
  else if (fallo?.clave === clave && fallo.intento === intento) estado = 'error';

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return { estado, datos: exito?.datos ?? null, deParametros: exito ? JSON.parse(exito.clave) : null, reintentar };
}
