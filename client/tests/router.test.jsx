import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { montarApp, simularFetch } from './ayudas.jsx';

beforeEach(() => simularFetch());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('router y layout', () => {
  it('muestra la página de inicio en "/" dentro del layout', async () => {
    await montarApp();
    expect(await screen.findByRole('heading', { level: 1, name: 'Finanzas personales' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Principal' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('muestra la página 404 en una ruta desconocida y permite volver al inicio', async () => {
    await montarApp({ ruta: '/no-existe' });
    expect(await screen.findByRole('heading', { name: 'Esta página no existe' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('ofrece un enlace para saltar al contenido', async () => {
    await montarApp();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#contenido');
  });
});
