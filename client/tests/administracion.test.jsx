// HU-04, HU-22 y HU-23 · sección "Administración" del cliente.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { confirmar, notificar } from '../src/shared/utils/notificaciones.js';

vi.mock('../src/shared/utils/notificaciones.js', () => ({
  confirmar: vi.fn(),
  notificar: { exito: vi.fn(), error: vi.fn(), atencion: vi.fn(), info: vi.fn() },
}));

const ADMIN = { ...USUARIO_PRUEBA, id: 'admin1', nombre: 'Ada Admin', email: 'ada@correo.com', rol: 'admin' };
const ANA = { id: 'u2', nombre: 'Ana Torres', email: 'ana@correo.com', rol: 'usuario', activo: true };
const LUIS = { id: 'u3', nombre: 'Luis Quispe', email: 'luis@correo.com', rol: 'usuario', activo: true };

const lista = (items, meta = {}) =>
  respuestaApi(200, {
    data: items,
    meta: { page: 1, limit: 10, total: items.length, totalPages: 1, ...meta },
  });
const exito = (data) => respuestaApi(200, { data });

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function abrir({ sesion = ADMIN, rutas = {}, ruta = '/administracion' } = {}) {
  const fetchSimulado = simularFetch(undefined, { sesion, rutas });
  await montarApp({ ruta, escritorio: true });
  return { fetchSimulado, usuario: userEvent.setup() };
}

describe('HU-04 · acceso a Administración', () => {
  it('Restricción: un usuario estándar no ve la opción y, por URL directa, recibe "Acceso no autorizado"', async () => {
    await abrir({ sesion: USUARIO_PRUEBA });
    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
  });

  it('Administración autorizada: el administrador ve la opción y entra', async () => {
    await abrir({ rutas: { '/admin/usuarios': () => lista([ANA]) } });
    expect(await screen.findByRole('heading', { level: 1, name: 'Administración' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Administración' }).length).toBeGreaterThan(0);
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument();
  });

  it('Degradación durante la sesión: ante un 403 se refresca la sesión y el menú oculta la opción', async () => {
    let sesionActual = ADMIN;
    const fetchSimulado = simularFetch(undefined, {
      sesion: undefined,
      rutas: {
        '/auth/me': async () => exito(sesionActual),
        '/admin/usuarios': async () => {
          sesionActual = USUARIO_PRUEBA; // el servidor ya lo degradó
          return respuestaError(403, 'FORBIDDEN', 'Acceso no autorizado');
        },
      },
    });
    await montarApp({ ruta: '/administracion', escritorio: true });

    expect(await screen.findByRole('heading', { name: 'Acceso no autorizado' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
    expect(llamadasA(fetchSimulado, '/auth/me').length).toBeGreaterThan(1);
  });
});

describe('HU-22 · usuarios en solo lectura', () => {
  it('Búsqueda de usuarios: envía el texto, vuelve a la página 1 y muestra los resultados', async () => {
    const { fetchSimulado, usuario } = await abrir({
      rutas: {
        '/admin/usuarios': () => lista([ANA, LUIS]),
      },
    });
    await screen.findByText('Ana Torres');
    fetchSimulado.mockClear();
    await usuario.type(screen.getByLabelText('Buscar por nombre o correo'), 'ana');
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(llamadasA(fetchSimulado, '/admin/usuarios')).toHaveLength(1));
    expect(llamadasA(fetchSimulado, '/admin/usuarios')[0][0]).toContain('q=ana');
    expect(llamadasA(fetchSimulado, '/admin/usuarios')[0][0]).toContain('page=1');
  });

  it('muestra la paginación y pide la página siguiente', async () => {
    const { fetchSimulado, usuario } = await abrir({
      rutas: { '/admin/usuarios': () => lista([ANA], { total: 25, totalPages: 3 }) },
    });
    await screen.findByText('Página 1 de 3');
    fetchSimulado.mockClear();
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(llamadasA(fetchSimulado, '/admin/usuarios')[0][0]).toContain('page=2'));
  });

  it('sin coincidencias muestra un estado vacío', async () => {
    await abrir({ rutas: { '/admin/usuarios': () => lista([]) } });
    expect(await screen.findByText('Todavía no hay usuarios.')).toBeInTheDocument();
  });

  it('Consulta de los datos de un usuario: solo lectura y estado vacío "Este usuario aún no tiene movimientos"', async () => {
    await abrir({
      ruta: '/administracion/usuarios/u2',
      rutas: { '/admin/usuarios/u2': () => exito(ANA) },
    });
    expect(await screen.findByRole('heading', { name: 'Ana Torres' })).toBeInTheDocument();
    expect(screen.getByText('Este usuario aún no tiene movimientos')).toBeInTheDocument();
    for (const seccion of ['Categorías', 'Cuentas', 'Movimientos', 'Presupuestos']) {
      expect(screen.getByRole('heading', { name: seccion })).toBeInTheDocument();
    }
    const contenido = screen.getByRole('main');
    expect(within(contenido).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/no puedes crear, editar ni eliminar/)).toBeInTheDocument();
  });

  it('un usuario inexistente muestra el mensaje de la API', async () => {
    await abrir({
      ruta: '/administracion/usuarios/nada',
      rutas: {
        '/admin/usuarios/nada': () =>
          respuestaError(
            404,
            'NOT_FOUND',
            'El recurso solicitado no existe o no tienes permiso para acceder a él',
          ),
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('El recurso solicitado no existe');
  });
});

describe('HU-23 · gestión de roles', () => {
  const abrirLista = (rutas = {}) =>
    abrir({ rutas: { '/admin/usuarios': () => lista([ANA, LUIS]), ...rutas } });

  it('Promoción: confirma, llama a la API, actualiza la fila y notifica', async () => {
    confirmar.mockResolvedValue(true);
    const { fetchSimulado, usuario } = await abrirLista({
      '/admin/usuarios/u2/rol': () => exito({ ...ANA, rol: 'admin' }),
    });
    await screen.findByText('Ana Torres');
    await usuario.selectOptions(screen.getByLabelText('Rol de Ana Torres'), 'admin');

    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ confirmar: 'Cambiar rol' }));
    await waitFor(() => expect(notificar.exito).toHaveBeenCalled());
    expect(JSON.parse(llamadasA(fetchSimulado, '/admin/usuarios/u2/rol')[0][1].body)).toEqual({
      rol: 'admin',
    });
    expect(screen.getByLabelText('Rol de Ana Torres')).toHaveValue('admin');
  });

  it('Cambio de rol sin confirmar: no llama a la API y el rol se mantiene', async () => {
    confirmar.mockResolvedValue(false);
    const { fetchSimulado, usuario } = await abrirLista();
    await screen.findByText('Ana Torres');
    await usuario.selectOptions(screen.getByLabelText('Rol de Ana Torres'), 'admin');

    expect(confirmar).toHaveBeenCalled();
    expect(llamadasA(fetchSimulado, '/admin/usuarios/u2/rol')).toHaveLength(0);
    expect(screen.getByLabelText('Rol de Ana Torres')).toHaveValue('usuario');
  });

  it('Degradación del último administrador rechazada: muestra el mensaje exacto y conserva el rol', async () => {
    confirmar.mockResolvedValue(true);
    const admins = [{ ...ADMIN, id: 'admin1', nombre: 'Ada Admin', activo: true }];
    const { usuario } = await abrir({
      rutas: {
        '/admin/usuarios': () => lista(admins),
        '/admin/usuarios/admin1/rol': () =>
          respuestaError(409, 'CONFLICT', 'Debe existir al menos un administrador'),
      },
    });
    await screen.findByLabelText('Rol de Ada Admin');
    await usuario.selectOptions(screen.getByLabelText('Rol de Ada Admin'), 'usuario');

    await waitFor(() =>
      expect(notificar.error).toHaveBeenCalledWith('Debe existir al menos un administrador'),
    );
    expect(screen.getByLabelText('Rol de Ada Admin')).toHaveValue('admin');
  });

  it('Degradación de otro administrador: se actualiza la fila', async () => {
    confirmar.mockResolvedValue(true);
    const otro = { ...ANA, rol: 'admin' };
    const { usuario } = await abrir({
      rutas: {
        '/admin/usuarios': () => lista([otro]),
        '/admin/usuarios/u2/rol': () => exito({ ...otro, rol: 'usuario' }),
      },
    });
    await screen.findByText('Ana Torres');
    await usuario.selectOptions(screen.getByLabelText('Rol de Ana Torres'), 'usuario');
    await waitFor(() => expect(screen.getByLabelText('Rol de Ana Torres')).toHaveValue('usuario'));
  });
});
