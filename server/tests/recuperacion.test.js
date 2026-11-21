// HU-03 · Recuperación de contraseña (4 escenarios de autenticacion-usuarios).
import request from 'supertest';
import { CLAVE, iniciarEntorno } from './helpers/api.js';

describe('HU-03 · recuperación de contraseña', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const solicitar = async (email) => {
    const res = await request(e.app).post('/api/v1/auth/olvide-contrasena').send({ email });
    await e.app.locals.servicios.recuperacion.esperarEnvios();
    return res;
  };
  const restablecer = (token, password = 'NuevaClave99') =>
    request(e.app).post('/api/v1/auth/restablecer-contrasena').send({ token, password });
  const correosPara = (email) =>
    e.transporte.sendMail.mock.calls.map(([c]) => c).filter((c) => c.to === email);
  const tokenDe = (email) =>
    correosPara(email)
      .at(-1)
      .text.match(/token=([\w-]+)/)[1];

  it('Solicitud de recuperación exitosa: respuesta genérica y un correo con enlace de un solo uso', async () => {
    const u = await e.registrar();
    const res = await solicitar(u.email);

    expect(res.status).toBe(200);
    expect(res.body.data.mensaje).toBe('Si el correo existe, recibirás un enlace de recuperación');
    const correo = correosPara(u.email).at(-1);
    expect(correo.subject).toMatch(/Restablece/);
    expect(correo.text).toMatch(/\/restablecer-contrasena\?token=[\w-]{40,}/);
  });

  it('Restablecimiento exitoso: entra con la contraseña nueva, la anterior ya no sirve y se cierran las sesiones', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    await solicitar(u.email);

    const res = await restablecer(tokenDe(u.email));
    expect(res.status).toBe(200);

    const sesion = await agente.get('/api/v1/auth/me');
    expect(sesion.status).toBe(401);
    expect(sesion.body.error.code).toBe('SESSION_REVOKED');

    expect((await e.iniciarSesion(u, CLAVE)).res.status).toBe(401);
    expect((await e.iniciarSesion(u, 'NuevaClave99')).res.status).toBe(200);
    expect(correosPara(u.email).at(-1).subject).toMatch(/actualizada/);
  });

  it('Correo no registrado: misma respuesta, mismo código y ningún correo (no revela si la cuenta existe)', async () => {
    const u = await e.registrar();
    const real = await solicitar(u.email);
    const enviados = e.transporte.sendMail.mock.calls.length;
    const inexistente = await solicitar(e.correoUnico());

    expect(inexistente.status).toBe(real.status);
    expect(inexistente.body).toEqual(real.body);
    expect(e.transporte.sendMail.mock.calls.length).toBe(enviados);
  });

  it('Enlace expirado: pasados 31 minutos se rechaza con el mensaje de la spec y no cambia la contraseña', async () => {
    const u = await e.registrar();
    await solicitar(u.email);
    const token = tokenDe(u.email);
    e.reloj.avanzarMinutos(31);

    const res = await restablecer(token);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('El enlace ha expirado');
    expect((await e.iniciarSesion(u)).res.status).toBe(200);
  });

  it('Enlace reutilizado: el segundo uso se rechaza igual que uno vencido', async () => {
    const u = await e.registrar();
    await solicitar(u.email);
    const token = tokenDe(u.email);

    expect((await restablecer(token)).status).toBe(200);
    const otra = await restablecer(token, 'OtraClave123');
    expect(otra.status).toBe(400);
    expect(otra.body.error.message).toBe('El enlace ha expirado');
    expect((await e.iniciarSesion(u, 'NuevaClave99')).res.status).toBe(200);
  });

  it('dos restablecimientos simultáneos con el mismo enlace: solo uno gana', async () => {
    const u = await e.registrar();
    await solicitar(u.email);
    const token = tokenDe(u.email);
    const res = await Promise.all([restablecer(token, 'ClaveUno123'), restablecer(token, 'ClaveDos123')]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 400]);
  });

  it('un token inventado o una contraseña insegura se rechazan', async () => {
    expect((await restablecer('x'.repeat(43))).status).toBe(400);
    const u = await e.registrar();
    await solicitar(u.email);
    const debil = await restablecer(tokenDe(u.email), 'abc');
    expect(debil.status).toBe(400);
    expect(debil.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('un segundo pedido dentro de 60 s no manda otro correo; pasado el enfriamiento invalida el enlace anterior', async () => {
    const u = await e.registrar();
    await solicitar(u.email);
    await solicitar(u.email);
    expect(correosPara(u.email).filter((c) => /Restablece/.test(c.subject))).toHaveLength(1);
    const primero = tokenDe(u.email);

    e.reloj.avanzarSegundos(61);
    await solicitar(u.email);
    expect(correosPara(u.email).filter((c) => /Restablece/.test(c.subject))).toHaveLength(2);
    expect((await restablecer(primero)).status).toBe(400);
    expect((await restablecer(tokenDe(u.email))).status).toBe(200);
  });

  it('un fallo del correo no cambia la respuesta de la solicitud', async () => {
    const u = await e.registrar();
    e.transporte.sendMail.mockRejectedValueOnce(new Error('SMTP caído'));
    expect((await solicitar(u.email)).status).toBe(200);
  });
});
