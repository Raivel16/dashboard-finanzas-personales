// HU-02 · el límite de 3 intentos no se burla con peticiones simultáneas.
import request from 'supertest';
import { iniciarEntorno } from './helpers/api.js';

describe('HU-02 · bloqueo ante intentos simultáneos', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  it('con 10 intentos paralelos solo 3 llegan a comprobar la contraseña; ni la correcta entra después', async () => {
    const usuario = await e.registrar();
    const login = (password) =>
      request(e.app).post('/api/v1/auth/login').send({ email: usuario.email, password });

    const resultados = await Promise.all(Array.from({ length: 10 }, () => login('Incorrecta1')));
    const estados = resultados.map((r) => r.status);
    expect(estados.filter((s) => s === 401)).toHaveLength(2);
    expect(estados.filter((s) => s === 429)).toHaveLength(8);

    expect((await login(usuario.password)).status).toBe(429);
  });
});
