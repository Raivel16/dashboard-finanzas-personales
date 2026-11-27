// Los 4 escenarios de RT-05 (interfaz-usuario): registro en celular, trabajo en escritorio,
// error comprensible, y movimiento reducido con teclado. Se verifican con el formulario real de movimientos.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { montarApp, respuestaApi, simularFetch } from './ayudas.jsx';
import { SelloAsentado } from '../src/shared/components/SelloAsentado.jsx';
import { simularMediaQuery } from './setup.js';

const CUENTA = { id: 'c1', nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '0.00', saldoActual: '0.00' };
const lista = (data) => respuestaApi(200, { data, meta: { page: 1, limit: 100, total: data.length, totalPages: 1 } });

beforeEach(() =>
  simularFetch(undefined, {
    rutas: {
      '/cuentas': async () => lista([CUENTA]),
      '/categorias': async () => lista([]),
      '/movimientos': async () => lista([]),
    },
  }),
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const abrirBoton = async () => (await screen.findAllByRole('button', { name: 'Nuevo movimiento' }))[0];

describe('RT-05 · interfaz consistente y responsiva', () => {
  it('Registro rápido en celular: abre a pantalla completa con el monto primero y teclado numérico', async () => {
    await montarApp({ ruta: '/movimientos', escritorio: false });
    await userEvent.click(await abrirBoton());

    const panel = screen.getByRole('dialog', { name: 'Nuevo movimiento' });
    expect(panel).toHaveAttribute('data-variante', 'pantalla-completa');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    const campos = within(panel).getAllByRole('textbox');
    expect(campos[0]).toHaveAccessibleName('Monto');
    expect(campos[0]).toHaveAttribute('inputmode', 'decimal');
  });

  it('Trabajo en escritorio: el formulario va en un panel lateral y el historial sigue visible', async () => {
    await montarApp({ ruta: '/movimientos', escritorio: true });
    await userEvent.click(await abrirBoton());

    const panel = screen.getByRole('dialog', { name: 'Nuevo movimiento' });
    expect(panel).toHaveAttribute('data-variante', 'panel-lateral');
    expect(panel).toHaveAttribute('aria-modal', 'false');
    expect(screen.getByRole('main')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Movimientos' })).toBeInTheDocument();
  });

  it('Error comprensible: marca el campo con ícono y texto y lleva el foco al primer error', async () => {
    await montarApp({ ruta: '/movimientos', escritorio: true });
    await userEvent.click(await abrirBoton());
    const panel = screen.getByRole('dialog', { name: 'Nuevo movimiento' });

    await userEvent.type(within(panel).getByLabelText('Monto'), 'abc');
    await userEvent.click(within(panel).getByRole('button', { name: 'Registrar movimiento' }));

    const monto = within(panel).getByLabelText('Monto');
    expect(monto).toHaveAttribute('aria-invalid', 'true');
    expect(monto).toHaveFocus();
    const aviso = panel.querySelector(`#${monto.getAttribute('aria-describedby')}`);
    expect(aviso.textContent.trim().length).toBeGreaterThan(0);
    expect(aviso.querySelector('svg')).not.toBeNull(); // ícono: el error no depende solo del color
    expect(monto).toHaveAccessibleDescription(aviso.textContent.trim());
  });

  it('Teclado: Enter abre el panel, Escape lo cierra y el foco vuelve al botón', async () => {
    await montarApp({ ruta: '/movimientos', escritorio: true, movimientoReducido: true });
    const abrir = await abrirBoton();
    abrir.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Nuevo movimiento' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('El sello "Asentado" no se anima si se pidió menos movimiento y sí en caso contrario', () => {
    simularMediaQuery({ '(prefers-reduced-motion: reduce)': true });
    const { unmount } = render(<SelloAsentado />);
    expect(screen.getByRole('status')).toHaveAttribute('data-animado', 'false');
    expect(screen.getByRole('status')).not.toHaveClass('sello-animado');
    unmount();

    simularMediaQuery({ '(prefers-reduced-motion: reduce)': false });
    render(<SelloAsentado />);
    expect(screen.getByRole('status')).toHaveClass('sello-animado');
  });
});
