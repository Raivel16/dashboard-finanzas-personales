import { useEffect, useState } from 'react';
import { useSesion } from '../../autenticacion/index.js';
import { listarMovimientosDeUsuario } from '../services/movimientos.service.js';

/** Movimientos recientes de otra persona para la consulta de administración (solo lectura). `estado`: cargando | listo | error. */
export function useMovimientosDeUsuario(usuarioId) {
  const { refrescarSesion } = useSesion();
  // Resultado de la última consulta terminada; "cargando" se deduce de que no corresponda al usuario actual.
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    listarMovimientosDeUsuario(usuarioId, { signal: control.signal })
      .then(({ data, meta }) =>
        setResultado({ usuarioId, movimientos: Array.isArray(data) ? data : [], total: meta?.total ?? 0 }),
      )
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        if (error.estado === 403) refrescarSesion();
        setResultado({ usuarioId, error: error.message });
      });
    return () => control.abort();
  }, [usuarioId, refrescarSesion]);

  const vigente = resultado?.usuarioId === usuarioId ? resultado : null;
  let estado = 'cargando';
  if (vigente) estado = vigente.error ? 'error' : 'listo';
  return {
    estado,
    mensaje: vigente?.error ?? '',
    movimientos: vigente?.movimientos ?? [],
    total: vigente?.total ?? 0,
  };
}
