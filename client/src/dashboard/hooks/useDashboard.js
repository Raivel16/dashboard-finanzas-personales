import { useEffect, useState } from 'react';
import { MENSAJES, fechaHoy } from '@finanzas/shared';
import { obtenerGraficos, obtenerIndicadores, obtenerMonedas } from '../services/dashboard.service.js';
import { useCarga } from './useCarga.js';

/**
 * Dashboard: mes y moneda elegidos, las monedas disponibles y las dos consultas (indicadores y gráficos), que cargan y
 * fallan por separado. Sin moneda elegida se usa la principal (el servidor la resuelve).
 */
export function useDashboard() {
  const [periodo, setPeriodo] = useState(() => fechaHoy().slice(0, 7));
  const [elegida, setElegida] = useState(null);
  const [monedas, setMonedas] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    obtenerMonedas({ signal: control.signal })
      .then(setMonedas)
      .catch(() => {}); // sin la lista el selector muestra solo la moneda en pantalla
    return () => control.abort();
  }, []);

  const parametros = { periodo, moneda: elegida ?? undefined };
  const indicadores = useCarga(obtenerIndicadores, parametros);
  const graficos = useCarga(obtenerGraficos, parametros);

  const mostrada = indicadores.datos?.moneda ?? elegida ?? monedas?.principal ?? '';
  const pedida = elegida ?? mostrada;

  let mensajeIndicadores = '';
  if (indicadores.estado === 'error') {
    // Si lo que se pidió es otra moneda que la que sigue en pantalla, el mensaje nombra la moneda pedida.
    const cambioDeMoneda = indicadores.datos && pedida && pedida !== indicadores.datos.moneda;
    mensajeIndicadores = cambioDeMoneda
      ? MENSAJES.dashboard.errorIndicadoresMoneda(pedida)
      : MENSAJES.dashboard.errorIndicadores;
  }

  return {
    periodo,
    cambiarPeriodo: (nuevo) => nuevo && setPeriodo(nuevo),
    moneda: pedida,
    cambiarMoneda: setElegida,
    monedas: monedas?.monedas?.length ? monedas.monedas : [mostrada].filter(Boolean),
    indicadores: {
      estado: indicadores.estado,
      datos: indicadores.datos,
      mensaje: mensajeIndicadores,
      reintentar: indicadores.reintentar,
    },
    graficos: {
      estado: graficos.estado,
      datos: graficos.datos,
      mensaje: graficos.estado === 'error' ? MENSAJES.dashboard.errorGraficos : '',
      reintentar: graficos.reintentar,
    },
  };
}
