// HU-20 · Gestionar mi perfil y HU-21 · Cambiar mi contraseña (cliente).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  USUARIO_PRUEBA,
  llamadasA,
  montarApp,
  respuestaApi,
  respuestaError,
  simularFetch,
} from './ayudas.jsx';
import { notificar } from '../src/shared/utils/notificaciones.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const exito = (data) => respuestaApi(200, { data });
const cuerpoDe = (simulado, ruta) => JSON.parse(llamadasA(simulado, ruta).at(-1)[1].body);

async function abrirPerfil(rutas = {}) {
  const fetchSimulado = simularFetch(undefined, { rutas });
  vi.spyOn(notificar, 'exito').mockImplementation(() => {});
  await montarApp({ ruta: '/perfil', escritorio: true });
  await screen.findByRole('heading', { level: 1, name: 'Mi perfil' });
  return { fetchSimulado, usuario: userEvent.setup() };
}

describe('HU-20 · Mi perfil', () => {
  it('Actualización exitosa del nombre: guarda, notifica y el menú muestra el nombre nuevo', async () => {
    const { fetchSimulado, usuario } = await abrirPerfil({
      '/perfil': () => exito({ ...USUARIO_PRUEBA, nombre: 'Ana María' }),
    });
    const campo = screen.getByLabelText('Nombre');
    expect(campo).toHaveValue('Ana Torres');
    await usuario.clear(campo);
    await usuario.type(campo, 'Ana María');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalledWith('Tu perfil se actualizó'));
    expect(cuerpoDe(fetchSimulado, '/perfil')).toEqual({ nombre: 'Ana María', monedaPrincipal: 'PEN' });
    const navegacion = screen.getByRole('complementary');
    expect(within(navegacion).getByText('Ana María')).toBeInTheDocument();
  });

  it('Cambio de moneda principal: envía USD y la sesión la conserva', async () => {
    const { fetchSimulado, usuario } = await abrirPerfil({
      '/perfil': () => exito({ ...USUARIO_PRUEBA, monedaPrincipal: 'USD' }),
    });
    expect(screen.getByLabelText('Moneda principal')).toHaveValue('PEN');
    await usuario.selectOptions(screen.getByLabelText('Moneda principal'), 'USD');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(notificar.exito).toHaveBeenCalled());
    expect(cuerpoDe(fetchSimulado, '/perfil').monedaPrincipal).toBe('USD');
    expect(screen.getByLabelText('Moneda principal')).toHaveValue('USD');
  });

  it('Nombre inválido: bloquea el guardado con "El nombre es obligatorio" y no llama a la API', async () => {
    const { fetchSimulado, usuario } = await abrirPerfil();
    await usuario.clear(screen.getByLabelText('Nombre'));
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const campo = screen.getByLabelText('Nombre');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('El nombre es obligatorio');
    expect(campo).toHaveFocus();
    expect(llamadasA(fetchSimulado, '/perfil')).toHaveLength(0);
  });

  it('Correo no editable: es de solo lectura con la nota y no se envía', async () => {
    const { fetchSimulado, usuario } = await abrirPerfil({ '/perfil': () => exito(USUARIO_PRUEBA) });
    const correo = screen.getByLabelText('Correo electrónico');
    expect(correo).toHaveValue('ana@correo.com');
    expect(correo).toHaveAttribute('readonly');
    expect(correo).toHaveAccessibleDescription('El correo no se puede cambiar');

    await usuario.type(correo, 'otro@correo.com');
    expect(correo).toHaveValue('ana@correo.com');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(llamadasA(fetchSimulado, '/perfil')).toHaveLength(1));
    expect(cuerpoDe(fetchSimulado, '/perfil')).not.toHaveProperty('email');
  });
});

describe('HU-21 · cambiar contraseña', () => {
  const llenar = async (usuario, actual, nueva, confirmacion = nueva) => {
    await usuario.type(screen.getByLabelText('Contraseña actual'), actual);
    await usuario.type(screen.getByLabelText('Contraseña nueva'), nueva);
    await usuario.type(screen.getByLabelText('Confirmar contraseña nueva'), confirmacion);
    await usuario.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
  };

  it('Cambio exitoso: envía solo la actual y la nueva, confirma y limpia el formulario', async () => {
    const { fetchSimulado, usuario } = await abrirPerfil({
      '/perfil/contrasena': () => exito({ mensaje: 'ok' }),
    });
    await llenar(usuario, 'Clave1234', 'NuevaClave99');

    await waitFor(() =>
      expect(notificar.exito).toHaveBeenCalledWith(expect.stringMatching(/contraseña se actualizó/)),
    );
    expect(cuerpoDe(fetchSimulado, '/perfil/contrasena')).toEqual({
      passwordActual: 'Clave1234',
      passwordNueva: 'NuevaClave99',
    });
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('');
  });

  it('Contraseña actual incorrecta: marca su campo con el mensaje de la spec', async () => {
    const { usuario } = await abrirPerfil({
      '/perfil/contrasena': () =>
        respuestaError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', [
          { campo: 'passwordActual', mensaje: 'La contraseña actual es incorrecta' },
        ]),
    });
    await llenar(usuario, 'Mala1234', 'NuevaClave99');

    const campo = screen.getByLabelText('Contraseña actual');
    await waitFor(() => expect(campo).toHaveAttribute('aria-invalid', 'true'));
    expect(campo).toHaveAccessibleDescription('La contraseña actual es incorrecta');
    expect(notificar.exito).not.toHaveBeenCalled();
  });

  it('Nueva igual a la actual: marca el campo de la nueva con el mensaje de la spec', async () => {
    const { usuario } = await abrirPerfil({
      '/perfil/contrasena': () =>
        respuestaError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', [
          { campo: 'passwordNueva', mensaje: 'La nueva contraseña debe ser distinta de la actual' },
        ]),
    });
    await llenar(usuario, 'Clave1234', 'Clave1234');

    const campo = screen.getByLabelText('Contraseña nueva');
    await waitFor(() => expect(campo).toHaveAttribute('aria-invalid', 'true'));
    expect(campo).toHaveAccessibleDescription('La nueva contraseña debe ser distinta de la actual');
  });

  it('Confirmación distinta: no llama a la API', async () => {
    const { fetchSimulado, usuario } = await abrirPerfil();
    await llenar(usuario, 'Clave1234', 'NuevaClave99', 'OtraClave99');

    expect(screen.getByLabelText('Confirmar contraseña nueva')).toHaveAccessibleDescription(
      'Las contraseñas no coinciden',
    );
    expect(llamadasA(fetchSimulado, '/perfil/contrasena')).toHaveLength(0);
  });

  it('Cuenta bloqueada por intentos: muestra el aviso del servidor', async () => {
    const { usuario } = await abrirPerfil({
      '/perfil/contrasena': () =>
        respuestaError(
          429,
          'TOO_MANY_REQUESTS',
          'Demasiados intentos fallidos. Inténtalo nuevamente en 5 minutos.',
        ),
    });
    await llenar(usuario, 'Clave1234', 'NuevaClave99');
    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos fallidos');
  });
});

describe('navegación', () => {
  it('"Mi perfil" aparece en la navegación', async () => {
    simularFetch();
    await montarApp({ escritorio: true });
    expect(screen.getAllByRole('link', { name: 'Mi perfil' }).length).toBeGreaterThan(0);
  });
});
