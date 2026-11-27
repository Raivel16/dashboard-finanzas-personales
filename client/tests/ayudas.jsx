import { render, screen, waitFor } from '@testing-library/react';
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

export const USUARIO_PRUEBA = {
  id: '1',
  nombre: 'Ana Torres',
  email: 'ana@correo.com',
  rol: 'usuario',
  monedaPrincipal: 'PEN',
};

/** Respuesta JSON de la API para simular fetch. */
export const respuestaApi = (estado, cuerpo) => ({
  ok: estado < 400,
  status: estado,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
});

export const respuestaError = (estado, code, message, details) =>
  respuestaApi(estado, { error: { code, message, ...(details && { details }) } });

/** Respuesta vacía del dashboard (sin movimientos) para las pruebas que no lo revisan. */
function respuestaDashboard(ruta) {
  if (ruta === '/dashboard/monedas') return respuestaApi(200, { data: { principal: 'PEN', monedas: ['PEN'] } });
  if (ruta === '/dashboard/indicadores') {
    return respuestaApi(200, {
      data: { periodo: '2026-01', moneda: 'PEN', ingresos: '0.00', gastos: '0.00', balance: '0.00', hayMovimientos: false, presupuesto: null },
    });
  }
  return respuestaApi(200, {
    data: { periodo: '2026-01', moneda: 'PEN', evolucion: [], distribucion: { total: '0.00', items: [] } },
  });
}

/**
 * Simula fetch. `respuesta` es lo que contesta a cualquier ruta; /auth/me contesta con la sesión:
 * una persona con sesión iniciada (por defecto), `null` para "sin sesión" o una respuesta propia.
 * `rutas` permite contestar rutas concretas: { '/auth/login': (opciones) => respuesta }.
 */
export function simularFetch(respuesta = respuestaSalud(), { sesion = USUARIO_PRUEBA, rutas = {} } = {}) {
  const simulado = vi.fn(async (url, opciones) => {
    const ruta = String(url).replace('/api/v1', '').split('?')[0];
    if (rutas[ruta]) return rutas[ruta](opciones, String(url));
    if (ruta === '/auth/me') {
      if (sesion && sesion.ok !== undefined) return sesion;
      return sesion
        ? respuestaApi(200, { data: sesion })
        : respuestaError(401, 'UNAUTHORIZED', 'Acceso no autorizado');
    }
    if (ruta.startsWith('/dashboard/')) return respuestaDashboard(ruta);
    return respuesta;
  });
  vi.stubGlobal('fetch', simulado);
  return simulado;
}

/** Llamadas a fetch cuya ruta coincide (sin el prefijo /api/v1). */
export const llamadasA = (simulado, ruta) =>
  simulado.mock.calls.filter(([url]) => String(url).replace('/api/v1', '').split('?')[0] === ruta);

/** Monta la aplicación con un router de memoria y espera a que se resuelva la sesión. `escritorio` y `movimientoReducido` simulan matchMedia. */
export async function montarApp({
  ruta = '/',
  escritorio = false,
  movimientoReducido = false,
} = {}) {
  simularMediaQuery({
    '(min-width: 1024px)': escritorio,
    '(prefers-reduced-motion: reduce)': movimientoReducido,
  });
  const router = crearRouterMemoria(ruta);
  const vista = render(<RouterProvider router={router} />);
  // La sesión se consulta al abrir la app: se espera a saber si hay sesión antes de seguir.
  await waitFor(() => expect(screen.queryByText('Comprobando tu sesión…')).not.toBeInTheDocument());
  return { router, ...vista };
}
