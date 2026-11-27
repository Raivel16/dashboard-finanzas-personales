// RT-08 · Identificar los recursos con UUID públicos (contrato-api). El reloj marca el 2026-01-15.
import mongoose from 'mongoose';
import { iniciarEntorno } from './helpers/api.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('RT-08 · identificadores UUID públicos', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  async function persona() {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const cuenta = (
      await agente
        .post('/api/v1/cuentas')
        .send({ nombre: 'Billetera', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '500' })
    ).body.data;
    const categoria = (await agente.get('/api/v1/categorias?limit=100')).body.data.find(
      (c) => c.tipo === 'gasto',
    );
    return { agente, cuenta, categoria };
  }
  const gastar = (agente, datos) =>
    agente.post('/api/v1/movimientos').send({ tipo: 'gasto', monto: '25', fecha: '2026-01-10', ...datos });

  it('Recurso creado con un UUID: usuario, cuenta, categoría, movimiento y presupuesto se identifican con UUID v4', async () => {
    const { agente, cuenta, categoria } = await persona();
    const usuario = (await agente.get('/api/v1/auth/me')).body.data;
    const propia = (
      await agente.post('/api/v1/categorias').send({ nombre: 'Mascotas', tipo: 'gasto', icono: 'utensils' })
    ).body.data;
    const movimiento = (await gastar(agente, { cuentaId: cuenta.id, categoriaId: categoria.id })).body.data;
    const presupuesto = (
      await agente.post('/api/v1/presupuestos').send({ periodo: '2026-01', moneda: 'PEN', monto: '800' })
    ).body.data;

    for (const recurso of [usuario, cuenta, categoria, propia, movimiento, presupuesto]) {
      expect(recurso.id).toMatch(UUID_V4);
    }
    // En la base, el identificador público es el propio _id del documento.
    const guardado = await mongoose.connection.collection('movimientos').findOne({ _id: movimiento.id });
    expect(guardado).not.toBeNull();
    expect(new Set([usuario.id, cuenta.id, propia.id, movimiento.id, presupuesto.id]).size).toBe(5);
  });

  it('Referencias y consultas por UUID: el movimiento se consulta, edita y elimina por su UUID y referencia los de su cuenta y categoría', async () => {
    const { agente, cuenta, categoria } = await persona();
    const creado = (await gastar(agente, { cuentaId: cuenta.id, categoriaId: categoria.id })).body.data;

    const leido = await agente.get(`/api/v1/movimientos/${creado.id}`);
    expect(leido.status).toBe(200);
    expect(leido.body.data).toMatchObject({ id: creado.id, cuentaId: cuenta.id, categoriaId: categoria.id });

    const editado = await agente.patch(`/api/v1/movimientos/${creado.id}`).send({ monto: '30' });
    expect(editado.status).toBe(200);
    expect(editado.body.data.monto).toBe('30.00');

    expect((await agente.delete(`/api/v1/movimientos/${creado.id}`)).status).toBe(204);
    expect((await agente.get(`/api/v1/movimientos/${creado.id}`)).status).toBe(404);
  });

  it('Identificador mal formado: 404 en la ruta y 400 "El identificador no es válido" en el cuerpo', async () => {
    const { agente, cuenta, categoria } = await persona();
    // Un ObjectId de MongoDB ya no es un identificador válido.
    for (const id of ['no-es-un-uuid', '65f000000000000000000001', '65f00000-0000-1000-8000-000000000001']) {
      expect((await agente.get(`/api/v1/cuentas/${id}`)).status).toBe(404);
      expect((await agente.delete(`/api/v1/movimientos/${id}`)).status).toBe(404);
    }

    const res = await gastar(agente, { cuentaId: 'abc', categoriaId: categoria.id });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toContainEqual({
      campo: 'cuentaId',
      mensaje: 'El identificador no es válido',
    });
    const sinCategoria = await gastar(agente, {
      cuentaId: cuenta.id,
      categoriaId: '65f000000000000000000001',
    });
    expect(sinCategoria.status).toBe(400);
    expect(sinCategoria.body.error.details).toContainEqual({
      campo: 'categoriaId',
      mensaje: 'El identificador no es válido',
    });
  });

  it('UUID de otro usuario: responde 404 sin revelar datos, y un id enviado en el cuerpo se ignora', async () => {
    const ana = await persona();
    const beto = await persona();

    const ajena = await beto.agente.get(`/api/v1/cuentas/${ana.cuenta.id}`);
    expect(ajena.status).toBe(404);
    expect(JSON.stringify(ajena.body)).not.toContain('Billetera');
    expect((await beto.agente.delete(`/api/v1/cuentas/${ana.cuenta.id}`)).status).toBe(404);

    const elegido = '11111111-1111-4111-8111-111111111111';
    const creada = await ana.agente
      .post('/api/v1/cuentas')
      .send({
        id: elegido,
        _id: elegido,
        nombre: 'Ahorros',
        tipo: 'banco',
        moneda: 'PEN',
        saldoInicial: '0',
      });
    expect(creada.status).toBe(201);
    expect(creada.body.data.id).toMatch(UUID_V4);
    expect(creada.body.data.id).not.toBe(elegido);
  });
});
