import { useEffect, useState } from 'react';
import { useSesion } from '../../autenticacion/index.js';
import { obtenerUsuario } from '../services/administracion.service.js';

/** Datos de un usuario para la consulta de administración. `estado`: cargando | listo | error. */
export function useDetalleUsuario(id) {
  const { refrescarSesion } = useSesion();
  // Resultado de la última consulta terminada; "cargando" se deduce de que no corresponda al id actual.
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    obtenerUsuario(id, { signal: control.signal })
      .then((usuario) => setResultado({ id, usuario }))
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        if (error.estado === 403) refrescarSesion();
        setResultado({ id, error: error.message });
      });
    return () => control.abort();
  }, [id, refrescarSesion]);

  const vigente = resultado?.id === id ? resultado : null;
  let estado = 'cargando';
  if (vigente) estado = vigente.error ? 'error' : 'listo';
  return { estado, usuario: vigente?.usuario ?? null, mensaje: vigente?.error ?? '' };
}
