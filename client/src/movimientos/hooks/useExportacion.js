import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MENSAJES, fechaHoy } from '@finanzas/shared';
import { guardarArchivo } from '../../shared/utils/descargas.js';
import { descargarReporte, listarMovimientos } from '../services/movimientos.service.js';

const ESPERA_LENTA_MS = 3000;

/** Primer y último día del mes en curso ("AAAA-MM-DD"). */
function mesEnCurso(hoy = fechaHoy()) {
  const [anio, mes] = hoy.split('-').map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const prefijo = hoy.slice(0, 7);
  return { desde: `${prefijo}-01`, hasta: `${prefijo}-${String(ultimo).padStart(2, '0')}` };
}

/**
 * Exportar el historial filtrado a PDF o Excel (HU-16, HU-17, HU-31). Sin rango de fechas el reporte cubre el mes
 * en curso, así que los botones se habilitan según los movimientos de ESE período (no del historial completo).
 * El archivo lo genera el servidor y solo se descarga si llegó completo. `version` cambia cuando el historial se
 * recarga (alta, edición o baja) para volver a contar.
 */
export function useExportacion({ filtros, version }) {
  const porDefecto = !filtros.desde && !filtros.hasta;
  const filtrosReporte = useMemo(() => (porDefecto ? { ...filtros, ...mesEnCurso() } : filtros), [filtros, porDefecto]);

  const [total, setTotal] = useState(null); // movimientos que entrarían en el reporte; null mientras se cuenta
  const [generando, setGenerando] = useState(null);
  const [lenta, setLenta] = useState(false);
  const [error, setError] = useState(null);
  const temporizador = useRef(null);

  useEffect(() => {
    const control = new AbortController();
    listarMovimientos({ page: 1, limit: 1, filtros: filtrosReporte, signal: control.signal })
      .then(({ meta }) => setTotal(meta?.total ?? 0))
      .catch((falla) => {
        if (falla?.name !== 'AbortError') setTotal(null);
      });
    return () => control.abort();
  }, [filtrosReporte, version]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const exportar = useCallback(
    async (formato) => {
      setError(null);
      setLenta(false);
      setGenerando(formato);
      temporizador.current = setTimeout(() => setLenta(true), ESPERA_LENTA_MS);
      try {
        const { data, meta } = await descargarReporte(formato, filtrosReporte);
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
    [filtrosReporte],
  );

  return {
    exportar,
    generando,
    lenta,
    error,
    sinDatos: total === 0,
    periodo: porDefecto ? filtrosReporte : null,
    deshabilitado: !total || generando !== null,
  };
}
