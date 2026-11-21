// HU-01, HU-02, HU-03, HU-18, HU-19 · pantallas y sesión del cliente.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppLayout } from '../src/shared/components/AppLayout.jsx';
import {
  USUARIO_PRUEBA,
  llamadasA,
  montarApp,
  respuestaApi,
  respuestaError,
  simularFetch,
} from './ayudas.jsx';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

const exito = (data) => respuestaApi(200, { data });
const cuerpoDe = (simulado, ruta) => JSON.parse(llamadasA(simulado, ruta).at(-1)[1].body);
const escribir = async (usuario, etiqueta, texto) => usuario.type(screen.getByLabelText(etiqueta), texto);

describe('rutas protegidas y públicas', () => {
  it('sin sesión, una ruta protegida lleva al inicio de sesión', async () => {
    simularFetch(undefined, { sesion: null });
    await montarApp({ ruta: '/' });
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });

  it('con sesión, las pantallas públicas llevan al inicio', async () => {
    simularFetch();
    await montarApp({ ruta: '/iniciar-sesion' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Finanzas personales' })).toBeInTheDocument();
  });

  it('el enlace de recuperación se abre aunque ya haya sesión', async () => {
    simularFetch();
    await montarApp({ ruta: '/restablecer-contrasena?token=abc' });
    expect(await screen.findByRole('heading', { name: 'Crea una contraseña nueva' })).toBeInTheDocument();
  });
});

describe('HU-01 · registro', () => {
  const abrir = async (rutas = {}) => {
    const fetchSimulado = simularFetch(undefined, { sesion: null, rutas });
    await montarApp({ ruta: '/registro' });
    return { fetchSimulado, usuario: userEvent.setup() };
  };

  it('Registro exitoso: envía los datos y lleva al inicio de sesión con el mensaje de confirmación', async () => {
    const { fetchSimulado, usuario } = await abrir({
      '/auth/registro': () => respuestaApi(201, { data: {} }),
    });
    await escribir(usuario, 'Nombre', 'Ana Torres');
    await escribir(usuario, 'Correo electrónico', 'ana@correo.com');
    await escribir(usuario, 'Contraseña', 'Clave1234');
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Tu cuenta se creó correctamente');
    expect(cuerpoDe(fetchSimulado, '/auth/registro')).toEqual({
      nombre: 'Ana Torres',
      email: 'ana@correo.com',
      password: 'Clave1234',
    });
  });

  it('Correo ya registrado: marca el campo correo con el mensaje de la spec', async () => {
    const { usuario } = await abrir({
      '/auth/registro': () => respuestaError(409, 'CONFLICT', 'Este correo ya se encuentra registrado'),
    });
    await escribir(usuario, 'Nombre', 'Ana Torres');
    await escribir(usuario, 'Correo electrónico', 'ana@correo.com');
    await escribir(usuario, 'Contraseña', 'Clave1234');
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    const campo = await screen.findByLabelText('Correo electrónico');
    await waitFor(() => expect(campo).toHaveAttribute('aria-invalid', 'true'));
    expect(campo).toHaveAccessibleDescription('Este correo ya se encuentra registrado');
    expect(campo).toHaveFocus();
  });

  it('Contraseña insegura: no llama a la API y muestra el mensaje exacto en el campo', async () => {
    const { fetchSimulado, usuario } = await abrir();
    await escribir(usuario, 'Nombre', 'Ana Torres');
    await escribir(usuario, 'Correo electrónico', 'ana@correo.com');
    await escribir(usuario, 'Contraseña', 'abc');
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    const campo = screen.getByLabelText('Contraseña');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(
      'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número',
    );
    expect(llamadasA(fetchSimulado, '/auth/registro')).toHaveLength(0);
  });
});

describe('HU-02 · inicio de sesión', () => {
  const abrir = async (rutas = {}, ruta = '/iniciar-sesion', sesion = null) => {
    const fetchSimulado = simularFetch(undefined, { sesion, rutas });
    await montarApp({ ruta });
    return { fetchSimulado, usuario: userEvent.setup() };
  };
  const completar = async (usuario) => {
    await escribir(usuario, 'Correo electrónico', 'ana@correo.com');
    await escribir(usuario, 'Contraseña', 'Clave1234');
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
  };

  it('Inicio de sesión exitoso: entra a la aplicación y muestra el menú de la persona', async () => {
    const { usuario } = await abrir({ '/auth/login': () => exito(USUARIO_PRUEBA) });
    await completar(usuario);

    expect(await screen.findByRole('heading', { level: 1, name: 'Finanzas personales' })).toBeInTheDocument();
    expect(screen.getAllByText('Cerrar sesión').length).toBeGreaterThan(0);
  });

  it('Credenciales inválidas: muestra el mensaje genérico y no revela cuál dato falló', async () => {
    const { usuario } = await abrir({
      '/auth/login': () => respuestaError(401, 'UNAUTHORIZED', 'Credenciales inválidas'),
    });
    await completar(usuario);
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled();
  });

  it('Cuenta bloqueada: avisa los minutos, deshabilita el botón y lo habilita al pasar el bloqueo', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const bloqueadoHasta = new Date(Date.now() + 5 * 60_000).toISOString();
    const { usuario } = await abrir({
      '/auth/login': () =>
        respuestaError(429, 'TOO_MANY_REQUESTS', 'Credenciales inválidas', { bloqueadoHasta }),
    });
    const accion = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    void usuario;
    await completar(accion);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Demasiados intentos fallidos. Inténtalo nuevamente en 5 minutos.',
    );
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000 + 2000);
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled());
    expect(screen.queryByText(/Demasiados intentos/)).not.toBeInTheDocument();
  });

  it('Sesión expirada: al volver al inicio de sesión se explica el motivo', async () => {
    simularFetch(undefined, {
      sesion: respuestaError(
        401,
        'SESSION_EXPIRED',
        'Tu sesión ha expirado, por favor inicia sesión nuevamente',
      ),
    });
    await montarApp({ ruta: '/' });
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu sesión ha expirado, por favor inicia sesión nuevamente',
    );
  });

  it('Sesión cerrada desde otro dispositivo: se muestra el mensaje de sesión cerrada', async () => {
    simularFetch(undefined, {
      sesion: respuestaError(
        401,
        'SESSION_REVOKED',
        'Tu sesión se cerró, por favor inicia sesión nuevamente',
      ),
    });
    await montarApp({ ruta: '/' });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tu sesión se cerró, por favor inicia sesión nuevamente',
    );
  });

  it('Token de acceso vencido: se renueva en silencio y la persona sigue dentro', async () => {
    let intentos = 0;
    const fetchSimulado = simularFetch(undefined, {
      sesion: undefined,
      rutas: {
        '/auth/me': async () => {
          intentos += 1;
          return intentos === 1
            ? respuestaError(401, 'TOKEN_EXPIRED', 'Token expirado')
            : exito(USUARIO_PRUEBA);
        },
        '/auth/refresh': async () => exito(USUARIO_PRUEBA),
      },
    });
    await montarApp({ ruta: '/' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Finanzas personales' })).toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/auth/refresh')).toHaveLength(1);
  });
});

describe('HU-18 · cierre de sesión', () => {
  it('cierra la sesión, lleva al inicio de sesión y "Atrás" no vuelve a mostrar datos', async () => {
    const fetchSimulado = simularFetch(undefined, {
      rutas: { '/auth/logout': async () => respuestaApi(204) },
    });
    const { router } = await montarApp({ escritorio: true });
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/auth/logout')).toHaveLength(1);

    await act(async () => {
      await router.navigate(-1);
    });
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });
});

describe('HU-03 · recuperación de contraseña', () => {
  it('Solicitud: muestra siempre el mensaje genérico', async () => {
    const fetchSimulado = simularFetch(undefined, {
      sesion: null,
      rutas: {
        '/auth/olvide-contrasena': () =>
          exito({ mensaje: 'Si el correo existe, recibirás un enlace de recuperación' }),
      },
    });
    await montarApp({ ruta: '/olvide-contrasena' });
    const usuario = userEvent.setup();
    await escribir(usuario, 'Correo electrónico', 'nadie@correo.com');
    await usuario.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Si el correo existe, recibirás un enlace de recuperación',
    );
    expect(cuerpoDe(fetchSimulado, '/auth/olvide-contrasena')).toEqual({ email: 'nadie@correo.com' });
  });

  it('Restablecimiento exitoso: usa el token de la URL, lo quita de la barra y lleva al inicio de sesión', async () => {
    window.history.replaceState(null, '', '/restablecer-contrasena?token=tok-123');
    const fetchSimulado = simularFetch(undefined, {
      sesion: null,
      rutas: { '/auth/restablecer-contrasena': () => exito({ mensaje: 'ok' }) },
    });
    await montarApp({ ruta: '/restablecer-contrasena?token=tok-123' });
    const usuario = userEvent.setup();
    expect(window.location.search).toBe('');

    await escribir(usuario, 'Contraseña nueva', 'NuevaClave99');
    await usuario.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Tu contraseña se actualizó');
    expect(cuerpoDe(fetchSimulado, '/auth/restablecer-contrasena')).toEqual({
      token: 'tok-123',
      password: 'NuevaClave99',
    });
  });

  it('Enlace expirado: lo informa y ofrece pedir uno nuevo', async () => {
    simularFetch(undefined, {
      sesion: null,
      rutas: {
        '/auth/restablecer-contrasena': () => respuestaError(400, 'TOKEN_INVALID', 'El enlace ha expirado'),
      },
    });
    await montarApp({ ruta: '/restablecer-contrasena?token=viejo' });
    const usuario = userEvent.setup();
    await escribir(usuario, 'Contraseña nueva', 'NuevaClave99');
    await usuario.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace ha expirado');
    expect(screen.getByRole('link', { name: 'Solicitar un enlace nuevo' })).toHaveAttribute(
      'href',
      '/olvide-contrasena',
    );
  });

  it('Sin token en la dirección: muestra el enlace no disponible', async () => {
    simularFetch(undefined, { sesion: null });
    await montarApp({ ruta: '/restablecer-contrasena' });
    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace ha expirado');
  });
});

describe('AppLayout · destinos soloAdmin', () => {
  const destinos = [
    { ruta: '/', etiqueta: 'Inicio' },
    { ruta: '/administracion', etiqueta: 'Administración', soloAdmin: true },
  ];
  const mostrar = (esAdmin) => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <AppLayout destinos={destinos} esAdmin={esAdmin} menuUsuario={() => <p>Menú de la persona</p>} />
        ),
      },
    ]);
    return render(<RouterProvider router={router} />);
  };

  it('un administrador ve los destinos soloAdmin', () => {
    mostrar(true);
    expect(screen.getAllByRole('link', { name: 'Administración' }).length).toBeGreaterThan(0);
  });

  it('un usuario estándar no los ve', () => {
    mostrar(false);
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Inicio' }).length).toBeGreaterThan(0);
  });
});
