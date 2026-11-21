import { useCallback, useEffect, useState } from 'react';
import { useSesion } from '../../autenticacion/index.js';
import { listarUsuarios } from '../services/administracion.service.js';

const LIMITE = 10;
const META_VACIA = { page: 1, limit: LIMITE, total: 0, totalPages: 0 };

/** Listado de usuarios con búsqueda por nombre o correo y paginación. `estado`: cargando | listo | error. */
export function useUsuarios() {
  const { refrescarSesion } = useSesion();
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [intento, setIntento] = useState(0);
  // Resultado de la última consulta terminada; "cargando" se deduce de que no corresponda a la consulta actual.
  const [resultado, setResultado] = useState(null);
  const clave = `${busqueda}|${page}|${intento}`;

  useEffect(() => {
    const control = new AbortController();
    listarUsuarios({ q: busqueda, page, limit: LIMITE }, { signal: control.signal })
      .then(({ items, meta }) => setResultado({ clave, items, meta }))
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        // 403: el rol cambió durante la sesión; se vuelve a leer para que el menú deje de mostrar la opción.
        if (error.estado === 403) refrescarSesion();
        setResultado({ clave, error: error.message });
      });
    return () => control.abort();
  }, [clave, busqueda, page, refrescarSesion]);

  const buscar = (evento) => {
    evento?.preventDefault();
    setPage(1);
    setBusqueda(texto.trim());
  };

  /** Sustituye un usuario del listado (p. ej. tras cambiarle el rol) sin volver a pedir la página. */
  const reemplazar = useCallback((actualizado) => {
    setResultado((anterior) =>
      anterior?.items
        ? { ...anterior, items: anterior.items.map((u) => (u.id === actualizado.id ? actualizado : u)) }
        : anterior,
    );
  }, []);

  const vigente = resultado?.clave === clave ? resultado : null;
  let estado = 'cargando';
  if (vigente) estado = vigente.error ? 'error' : 'listo';

  return {
    estado,
    usuarios: vigente?.items ?? [],
    meta: vigente?.meta ?? META_VACIA,
    mensaje: vigente?.error ?? '',
    texto,
    busqueda,
    cambiarTexto: (evento) => setTexto(evento.target.value),
    buscar,
    irAPagina: setPage,
    reintentar: () => setIntento((n) => n + 1),
    reemplazar,
  };
}
