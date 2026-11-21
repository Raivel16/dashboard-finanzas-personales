// HU-01 · Registro de nuevo usuario (4 escenarios de autenticacion-usuarios).
import request from 'supertest';
import mongoose from 'mongoose';
import { CLAVE, iniciarEntorno, ultimoCorreo } from './helpers/api.js';

describe('HU-01 · registro', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const registro = (datos) => request(e.app).post('/api/v1/auth/registro').send(datos);
  const usuarios = () => mongoose.connection.collection('usuarios');

  it('Registro exitoso con datos válidos: crea la cuenta, cifra la contraseña y asigna el rol usuario', async () => {
    const email = e.correoUnico();
    const res = await registro({ nombre: '  Ana Torres ', email: email.toUpperCase(), password: CLAVE });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      nombre: 'Ana Torres',
      email,
      rol: 'usuario',
      monedaPrincipal: 'PEN',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);

    const guardado = await usuarios().findOne({ email });
    expect(guardado.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(guardado.passwordHash).not.toContain(CLAVE);
    expect(guardado.rol).toBe('usuario');
  });

  it('Creación exitosa de identificadores y aislamiento de datos: cada cuenta recibe su tenantId y un correo de bienvenida', async () => {
    const a = await e.registrar();
    const b = await e.registrar();
    const [ua, ub] = await Promise.all([
      usuarios().findOne({ email: a.email }),
      usuarios().findOne({ email: b.email }),
    ]);

    expect(ua.tenantId).toMatch(/^[0-9a-f-]{36}$/);
    expect(ua.tenantId).not.toBe(ub.tenantId);
    expect(String(ua._id)).toBe(a.id);

    const correo = e.transporte.sendMail.mock.calls.map(([c]) => c).find((c) => c.to === b.email);
    expect(correo.subject).toMatch(/Bienvenido/);
    expect(correo.text).toContain('Ana Torres');
    expect(correo.text).toContain('/iniciar-sesion');
  });

  it('un fallo del correo de bienvenida no deshace el registro', async () => {
    e.transporte.sendMail.mockRejectedValueOnce(new Error('SMTP caído'));
    const email = e.correoUnico();
    const res = await registro({ nombre: 'Luis', email, password: CLAVE });
    expect(res.status).toBe(201);
    expect(await usuarios().countDocuments({ email })).toBe(1);
  });

  it('Registro rechazado por correo ya registrado: 409 con el mensaje de la spec y sin cuenta duplicada', async () => {
    const original = await e.registrar();
    const llamadas = e.transporte.sendMail.mock.calls.length;

    const res = await registro({ nombre: 'Otra', email: original.email.toUpperCase(), password: CLAVE });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'Este correo ya se encuentra registrado',
    });
    expect(await usuarios().countDocuments({ email: original.email })).toBe(1);
    expect(e.transporte.sendMail.mock.calls.length).toBe(llamadas); // no se envía bienvenida a la cuenta ajena
  });

  it('dos registros simultáneos con el mismo correo crean una sola cuenta', async () => {
    const email = e.correoUnico();
    const resultados = await Promise.all([
      registro({ nombre: 'Ana', email, password: CLAVE }),
      registro({ nombre: 'Berta', email, password: CLAVE }),
    ]);
    expect(resultados.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await usuarios().countDocuments({ email })).toBe(1);
  });

  it('Registro rechazado por contraseña insegura: 400, campo password y el mensaje exacto de la spec', async () => {
    const email = e.correoUnico();
    const res = await registro({ nombre: 'Ana', email, password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      {
        campo: 'password',
        mensaje: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número',
      },
    ]);
    expect(await usuarios().countDocuments({ email })).toBe(0);
  });

  it('valida nombre y correo, y rechaza intentos de inyección de operadores', async () => {
    const res = await registro({ nombre: 'A', email: { $ne: '' }, password: CLAVE });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.campo)).toEqual(['nombre', 'email']);
    expect(ultimoCorreo(e.transporte)).toBeDefined();
  });
});
