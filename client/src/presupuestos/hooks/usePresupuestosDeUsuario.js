import { useEffect, useState } from 'react';
import { useSesion } from '../../autenticacion/index.js';
import { listarPresupuestosDeUsuario } from '../services/presupuestos.service.js';

/** Presupuestos de otra persona para la consulta de administración (solo lectura). `estado`: cargando | listo | error. */
export function usePresupuestosDeUsuario(usuarioId) {
  const { refrescarSesion } = useSesion();
  // Resultado de la última consulta terminada; "cargando" se deduce de que no corresponda al usuario actual.
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    listarPresupuestosDeUsuario(usuarioId, { signal: control.signal })
      .then((presupuestos) =>
        setResultado({ usuarioId, presupuestos: Array.isArray(presupuestos) ? presupuestos : [] }),
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
  return { estado, mensaje: vigente?.error ?? '', presupuestos: vigente?.presupuestos ?? [] };
}
