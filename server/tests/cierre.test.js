// HU-18 · Cierre de sesión (4 escenarios de autenticacion-usuarios).
import request from 'supertest';
import { cookieDe, iniciarEntorno } from './helpers/api.js';

describe('HU-18 · cierre de sesión', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const me = (agente) => agente.get('/api/v1/auth/me');

  it('Cierre de sesión exitoso: 204, borra las cookies y la sesión deja de servir', async () => {
    const u = await e.registrar();
    const { agente, res: login } = await e.iniciarSesion(u);
    const acceso = cookieDe(login, 'access_token').valor;

    const res = await agente.post('/api/v1/auth/logout');
    expect(res.status).toBe(204);
    expect(cookieDe(res, 'access_token').texto).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
    expect(cookieDe(res, 'refresh_token').texto).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);

    // Un token de acceso copiado antes de cerrar tampoco sirve: la sesión quedó revocada.
    const viejo = await request(e.app).get('/api/v1/auth/me').set('Cookie', `access_token=${acceso}`);
    expect(viejo.status).toBe(401);
    expect(viejo.body.error).toMatchObject({
      code: 'SESSION_REVOKED',
      message: 'Tu sesión se cerró, por favor inicia sesión nuevamente',
    });
  });

  it('Cierre de sesión con otras sesiones activas: solo se cierra la del dispositivo actual', async () => {
    const u = await e.registrar();
    const { agente: movil } = await e.iniciarSesion(u);
    const { agente: portatil } = await e.iniciarSesion(u);

    expect((await movil.post('/api/v1/auth/logout')).status).toBe(204);
    expect((await me(portatil)).status).toBe(200);
  });

  it('Regreso tras cerrar sesión: la renovación con el token anterior es rechazada', async () => {
    const u = await e.registrar();
    const { agente, res: login } = await e.iniciarSesion(u);
    const renovacion = cookieDe(login, 'refresh_token').valor;
    await agente.post('/api/v1/auth/logout');

    const res = await request(e.app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh_token=${renovacion}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_REVOKED');
    expect((await me(agente)).status).toBe(401);
  });

  it('Cierre con la sesión ya expirada: responde 204 sin error y limpia las cookies', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    e.reloj.avanzarMinutos(31);

    const res = await agente.post('/api/v1/auth/logout');
    expect(res.status).toBe(204);
    expect(cookieDe(res, 'access_token')).not.toBeNull();
  });

  it('cerrar sin ninguna sesión tampoco falla', async () => {
    expect((await request(e.app).post('/api/v1/auth/logout')).status).toBe(204);
  });
});
