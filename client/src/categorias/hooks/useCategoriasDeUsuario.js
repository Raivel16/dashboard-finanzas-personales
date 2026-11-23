import { useEffect, useState } from 'react';
import { useSesion } from '../../autenticacion/index.js';
import { listarCategoriasDeUsuario } from '../services/categorias.service.js';
import { agruparCategorias } from './useCategorias.js';

/** Categorías de otra persona para la consulta de administración (solo lectura). `estado`: cargando | listo | error. */
export function useCategoriasDeUsuario(usuarioId) {
  const { refrescarSesion } = useSesion();
  // Resultado de la última consulta terminada; "cargando" se deduce de que no corresponda al usuario actual.
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    listarCategoriasDeUsuario(usuarioId, { signal: control.signal })
      .then((categorias) => setResultado({ usuarioId, categorias: Array.isArray(categorias) ? categorias : [] }))
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
  return { estado, mensaje: vigente?.error ?? '', ...agruparCategorias(vigente?.categorias ?? []) };
}
