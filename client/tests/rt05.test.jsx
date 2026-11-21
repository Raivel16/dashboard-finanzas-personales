// Los 4 escenarios de RT-05 (interfaz-usuario): registro en celular, trabajo en escritorio,
// error comprensible, y movimiento reducido con teclado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { montarApp, simularFetch } from './ayudas.jsx';

beforeEach(() => simularFetch());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const botonesRegistrar = () => screen.getAllByRole('button', { name: /Registrar/ });

describe('RT-05 · interfaz consistente y responsiva', () => {
  it('Registro rápido en celular: abre a pantalla completa con el monto primero y teclado numérico', async () => {
    await montarApp({ escritorio: false });
    const navegacionInferior = screen.getAllByRole('navigation', { name: 'Principal' }).at(-1);
    await userEvent.click(within(navegacionInferior).getByRole('button', { name: /Registrar/ }));

    const panel = screen.getByRole('dialog', { name: 'Nuevo registro' });
    expect(panel).toHaveAttribute('data-variante', 'pantalla-completa');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    const campos = within(panel).getAllByRole('textbox');
    expect(campos[0]).toHaveAccessibleName('Monto');
    expect(campos[0]).toHaveAttribute('inputmode', 'decimal');
  });

  it('Trabajo en escritorio: el formulario va en un panel lateral y el historial sigue visible', async () => {
    await montarApp({ escritorio: true });
    await userEvent.click(botonesRegistrar()[0]);

    const panel = screen.getByRole('dialog', { name: 'Nuevo registro' });
    expect(panel).toHaveAttribute('data-variante', 'panel-lateral');
    expect(panel).toHaveAttribute('aria-modal', 'false');
    expect(screen.getByRole('main')).toBeVisible();
    expect(await screen.findByRole('heading', { level: 1, name: 'Finanzas personales' })).toBeInTheDocument();
  });

  it('Error comprensible: marca el campo con ícono y texto y lleva el foco al primer error', async () => {
    await montarApp({ escritorio: true });
    await userEvent.click(botonesRegistrar()[0]);
    const panel = screen.getByRole('dialog', { name: 'Nuevo registro' });

    await userEvent.type(within(panel).getByLabelText('Monto'), 'abc');
    await userEvent.click(within(panel).getByRole('button', { name: 'Asentar' }));

    const monto = within(panel).getByLabelText('Monto');
    expect(monto).toHaveAttribute('aria-invalid', 'true');
    expect(monto).toHaveFocus();
    const aviso = panel.querySelector(`#${monto.getAttribute('aria-describedby')}`);
    expect(aviso.textContent.trim().length).toBeGreaterThan(0);
    expect(aviso.querySelector('svg')).not.toBeNull(); // ícono: el error no depende solo del color
    expect(monto).toHaveAccessibleDescription(aviso.textContent.trim());
  });

  it('Movimiento reducido y teclado: Escape cierra el panel, el foco vuelve y el sello no se anima', async () => {
    await montarApp({ escritorio: true, movimientoReducido: true });
    const abrir = botonesRegistrar()[0];
    abrir.focus();
    await userEvent.keyboard('{Enter}');
    const panel = screen.getByRole('dialog', { name: 'Nuevo registro' });

    await userEvent.type(within(panel).getByLabelText('Monto'), '25.50');
    await userEvent.type(within(panel).getByLabelText('Nombre'), 'Caja chica');
    await userEvent.click(within(panel).getByRole('button', { name: 'Asentar' }));

    const sello = await within(panel).findByRole('status');
    expect(sello).toHaveTextContent('Asentado');
    expect(sello).toHaveAttribute('data-animado', 'false');
    expect(sello).not.toHaveClass('sello-animado');

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('anima el sello cuando no se pidió menos movimiento', async () => {
    await montarApp({ escritorio: true, movimientoReducido: false });
    await userEvent.click(botonesRegistrar()[0]);
    const panel = screen.getByRole('dialog', { name: 'Nuevo registro' });
    await userEvent.type(within(panel).getByLabelText('Monto'), '10');
    await userEvent.type(within(panel).getByLabelText('Nombre'), 'Ahorros');
    await userEvent.click(within(panel).getByRole('button', { name: 'Asentar' }));
    expect(await within(panel).findByRole('status')).toHaveClass('sello-animado');
  });
});
