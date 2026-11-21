import { useCallback, useEffect, useState } from 'react';
import { obtenerEstadoSistema } from '../services/inicio.service.js';

/** Consulta el estado del sistema. `estado`: cargando | listo | error. */
export function useEstadoSistema() {
  const [estado, setEstado] = useState('cargando');
  const [datos, setDatos] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    obtenerEstadoSistema({ signal: control.signal })
      .then((resultado) => {
        setDatos(resultado);
        setEstado('listo');
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setMensaje(error.message);
        setEstado('error');
      });
    return () => control.abort();
  }, [intento]);

  const reintentar = useCallback(() => {
    setEstado('cargando');
    setIntento((n) => n + 1);
  }, []);
  return { estado, datos, mensaje, reintentar };
}
