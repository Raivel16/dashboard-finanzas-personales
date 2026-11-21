// HU-20 · Gestionar mi perfil y HU-21 · Cambiar mi contraseña (8 escenarios de autenticacion-usuarios).
import mongoose from 'mongoose';
import { CLAVE, iniciarEntorno } from './helpers/api.js';

describe('HU-20 · perfil', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const usuarios = () => mongoose.connection.collection('usuarios');
  const sesionIniciada = async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    return { u, agente };
  };

  it('Actualización exitosa del nombre: se guarda saneado y /auth/me lo devuelve', async () => {
    const { agente } = await sesionIniciada();
    const res = await agente.patch('/api/v1/perfil').send({ nombre: '  Ana María  ' });
    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Ana María');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect((await agente.get('/api/v1/auth/me')).body.data.nombre).toBe('Ana María');
  });

  it('Cambio de moneda principal: pasa de PEN a USD y no toca otros datos del usuario', async () => {
    const { u, agente } = await sesionIniciada();
    expect((await agente.get('/api/v1/auth/me')).body.data.monedaPrincipal).toBe('PEN');
    const antes = await usuarios().findOne({ email: u.email });

    const res = await agente.patch('/api/v1/perfil').send({ nombre: 'Ana Torres', monedaPrincipal: 'usd' });
    expect(res.status).toBe(200);
    expect(res.body.data.monedaPrincipal).toBe('USD');
    const despues = await usuarios().findOne({ email: u.email });
    expect(despues).toMatchObject({ monedaPrincipal: 'USD', tenantId: antes.tenantId, rol: 'usuario' });
    expect((await agente.get('/api/v1/auth/me')).body.data.monedaPrincipal).toBe('USD');
  });

  it('sin enviar la moneda se conserva la actual', async () => {
    const { agente } = await sesionIniciada();
    await agente.patch('/api/v1/perfil').send({ nombre: 'Ana', monedaPrincipal: 'EUR' });
    const res = await agente.patch('/api/v1/perfil').send({ nombre: 'Ana B' });
    expect(res.body.data.monedaPrincipal).toBe('EUR');
  });

  it('Nombre inválido rechazado: 400 con "El nombre es obligatorio" y sin cambios', async () => {
    const { u, agente } = await sesionIniciada();
    const res = await agente.patch('/api/v1/perfil').send({ nombre: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ campo: 'nombre', mensaje: 'El nombre es obligatorio' }]);
    expect((await usuarios().findOne({ email: u.email })).nombre).toBe('Ana Torres');
    expect(
      (await agente.patch('/api/v1/perfil').send({ nombre: 'Ana', monedaPrincipal: 'XXX' })).status,
    ).toBe(400);
  });

  it('Correo no editable: enviar email, rol o tenantId no cambia nada', async () => {
    const { u, agente } = await sesionIniciada();
    const antes = await usuarios().findOne({ email: u.email });
    const res = await agente
      .patch('/api/v1/perfil')
      .send({ nombre: 'Ana', email: 'otro@correo.com', rol: 'admin', tenantId: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: u.email, rol: 'usuario' });
    const despues = await usuarios().findOne({ _id: antes._id });
    expect(despues).toMatchObject({ email: u.email, rol: 'usuario', tenantId: antes.tenantId });
    expect(await usuarios().countDocuments({ email: 'otro@correo.com' })).toBe(0);
  });

  it('sin sesión las rutas de perfil responden 401', async () => {
    const { default: request } = await import('supertest');
    expect((await request(e.app).patch('/api/v1/perfil').send({ nombre: 'Ana' })).status).toBe(401);
    expect(
      (
        await request(e.app)
          .put('/api/v1/perfil/contrasena')
          .send({ passwordActual: 'a', passwordNueva: 'b' })
      ).status,
    ).toBe(401);
  });

  it('cada persona solo modifica su propio perfil', async () => {
    const a = await sesionIniciada();
    const b = await sesionIniciada();
    await a.agente.patch('/api/v1/perfil').send({ nombre: 'Solo Ana', id: b.u.id });
    expect((await usuarios().findOne({ email: b.u.email })).nombre).toBe('Ana Torres');
  });
});

describe('HU-21 · cambio de contraseña', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const cambiar = (agente, passwordActual, passwordNueva) =>
    agente.put('/api/v1/perfil/contrasena').send({ passwordActual, passwordNueva });
  const correosPara = (email) =>
    e.transporte.sendMail.mock.calls.map(([c]) => c).filter((c) => c.to === email);

  it('Cambio exitoso: la contraseña nueva funciona, la anterior no, y se avisa por correo', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const res = await cambiar(agente, CLAVE, 'NuevaClave99');

    expect(res.status).toBe(200);
    expect(res.body.data.mensaje).toMatch(/contraseña se actualizó/);
    expect((await e.iniciarSesion(u, CLAVE)).res.status).toBe(401);
    expect((await e.iniciarSesion(u, 'NuevaClave99')).res.status).toBe(200);
    const hash = await mongoose.connection.collection('usuarios').findOne({ email: u.email });
    expect(hash.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(correosPara(u.email).at(-1).subject).toMatch(/actualizada/);
    expect(correosPara(u.email).at(-1).text).toMatch(/otras sesiones/);
  });

  it('Cierre de las demás sesiones: el celular se invalida y la computadora sigue activa', async () => {
    const u = await e.registrar();
    const { agente: computadora } = await e.iniciarSesion(u);
    const { agente: celular } = await e.iniciarSesion(u);

    expect((await cambiar(computadora, CLAVE, 'NuevaClave99')).status).toBe(200);

    const movil = await celular.get('/api/v1/auth/me');
    expect(movil.status).toBe(401);
    expect(movil.body.error.code).toBe('SESSION_REVOKED');
    expect((await computadora.get('/api/v1/auth/me')).status).toBe(200);
  });

  it('Contraseña actual incorrecta: 400 en el campo passwordActual y la contraseña no cambia', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const res = await cambiar(agente, 'Incorrecta1', 'NuevaClave99');

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { campo: 'passwordActual', mensaje: 'La contraseña actual es incorrecta' },
    ]);
    expect((await e.iniciarSesion(u)).res.status).toBe(200);
    expect((await agente.get('/api/v1/auth/me')).status).toBe(200); // un 400, no un 401: la sesión sigue
  });

  it('Nueva contraseña igual a la actual: se rechaza con el mensaje exacto', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const res = await cambiar(agente, CLAVE, CLAVE);
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { campo: 'passwordNueva', mensaje: 'La nueva contraseña debe ser distinta de la actual' },
    ]);
  });

  it('una nueva contraseña insegura se rechaza', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const res = await cambiar(agente, CLAVE, 'abc');
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].campo).toBe('passwordNueva');
  });

  it('quien no conoce la actual no averigua nada con la nueva: igual a la actual incorrecta sigue siendo "actual incorrecta"', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const res = await cambiar(agente, 'Incorrecta1', 'Incorrecta1');
    expect(res.body.error.details[0].campo).toBe('passwordActual');
  });

  it('adivinar la contraseña actual tiene el mismo límite que el inicio de sesión: al tercer fallo, 429', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const estados = [];
    for (let i = 0; i < 4; i += 1)
      estados.push((await cambiar(agente, `Mala${i}Clave`, 'NuevaClave99')).status);
    expect(estados).toEqual([400, 400, 429, 429]);
    expect((await cambiar(agente, CLAVE, 'NuevaClave99')).status).toBe(429);

    e.reloj.avanzarMinutos(6);
    expect((await cambiar(agente, CLAVE, 'NuevaClave99')).status).toBe(200);
  });

  it('un fallo del correo no deshace el cambio', async () => {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    e.transporte.sendMail.mockRejectedValueOnce(new Error('SMTP caído'));
    expect((await cambiar(agente, CLAVE, 'NuevaClave99')).status).toBe(200);
  });
});
