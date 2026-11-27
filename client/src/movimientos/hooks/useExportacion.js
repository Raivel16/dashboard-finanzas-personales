import { useCallback, useEffect, useRef, useState } from 'react';
import { MENSAJES } from '@finanzas/shared';
import { guardarArchivo } from '../../shared/utils/descargas.js';
import { descargarReporte } from '../services/movimientos.service.js';

const ESPERA_LENTA_MS = 3000;

/**
 * Exportar el historial filtrado a PDF o Excel (HU-16, HU-17, HU-31). El archivo lo genera el servidor y solo se
 * descarga si llegó completo. `generando` es el formato en curso o null; `lenta` avisa que la generación tarda.
 */
export function useExportacion({ filtros, hayDatos }) {
  const [generando, setGenerando] = useState(null);
  const [lenta, setLenta] = useState(false);
  const [error, setError] = useState(null);
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const exportar = useCallback(
    async (formato) => {
      setError(null);
      setLenta(false);
      setGenerando(formato);
      temporizador.current = setTimeout(() => setLenta(true), ESPERA_LENTA_MS);
      try {
        const { data, meta } = await descargarReporte(formato, filtros);
        guardarArchivo(data, meta.nombre);
      } catch (falla) {
        // Los errores que explican qué hacer (sin datos, más de 5000) se muestran tal cual; el resto, el genérico.
        setError(falla?.estado === 400 ? falla.message : MENSAJES.reporte.errorGenerar);
      } finally {
        clearTimeout(temporizador.current);
        setGenerando(null);
        setLenta(false);
      }
    },
    [filtros],
  );

  return { exportar, generando, lenta, error, deshabilitado: !hayDatos || generando !== null };
}
