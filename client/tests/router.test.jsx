import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { montarApp, respuestaSalud, simularFetch } from './ayudas.jsx';

beforeEach(() => simularFetch());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('router y layout', () => {
  it('muestra la página de inicio en "/" dentro del layout', async () => {
    montarApp();
    expect(await screen.findByRole('heading', { level: 1, name: 'Finanzas personales' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Principal' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('muestra la página 404 en una ruta desconocida y permite volver al inicio', async () => {
    montarApp({ ruta: '/no-existe' });
    expect(await screen.findByRole('heading', { name: 'Esta página no existe' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('enruta el catálogo solo en desarrollo', async () => {
    const { unmount } = montarApp({ ruta: '/catalogo', desarrollo: true });
    expect(await screen.findByRole('heading', { name: 'Catálogo de componentes' })).toBeInTheDocument();
    unmount();

    montarApp({ ruta: '/catalogo', desarrollo: false });
    expect(await screen.findByRole('heading', { name: 'Esta página no existe' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument();
  });

  it('ofrece un enlace para saltar al contenido', () => {
    montarApp();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#contenido');
  });
});

describe('inicio: estado del sistema', () => {
  it('consulta /api/v1/health y muestra el estado', async () => {
    const fetchSimulado = simularFetch();
    montarApp();
    expect(await screen.findByText('en línea')).toBeInTheDocument();
    expect(screen.getByText('conectada')).toBeInTheDocument();
    expect(fetchSimulado.mock.calls[0][0]).toBe('/api/v1/health');
  });

  it('avisa si la base de datos no responde', async () => {
    simularFetch(respuestaSalud({ data: { api: 'ok', baseDatos: 'error', replicaSet: false } }));
    montarApp();
    expect(await screen.findByText('sin conexión')).toBeInTheDocument();
  });

  it('muestra el error y permite reintentar', async () => {
    const fetchSimulado = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(respuestaSalud());
    vi.stubGlobal('fetch', fetchSimulado);
    const { default: userEvent } = await import('@testing-library/user-event');
    montarApp();

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('en línea')).toBeInTheDocument();
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });
});
