import { render } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import { crearRouterMemoria } from '../src/router/index.jsx';
import { simularMediaQuery } from './setup.js';

/** Respuesta de /health lista para simular fetch. */
export const respuestaSalud = (
  cuerpo = { data: { api: 'ok', baseDatos: 'ok', replicaSet: true } },
  estado = 200,
) => ({
  ok: estado < 400,
  status: estado,
  text: async () => JSON.stringify(cuerpo),
});

export function simularFetch(respuesta = respuestaSalud()) {
  const simulado = vi.fn().mockResolvedValue(respuesta);
  vi.stubGlobal('fetch', simulado);
  return simulado;
}

/** Monta la aplicación con un router de memoria. `escritorio` y `movimientoReducido` simulan matchMedia. */
export function montarApp({
  ruta = '/',
  escritorio = false,
  movimientoReducido = false,
  desarrollo = true,
} = {}) {
  simularMediaQuery({
    '(min-width: 1024px)': escritorio,
    '(prefers-reduced-motion: reduce)': movimientoReducido,
  });
  const router = crearRouterMemoria(ruta, { desarrollo });
  return { router, ...render(<RouterProvider router={router} />) };
}
