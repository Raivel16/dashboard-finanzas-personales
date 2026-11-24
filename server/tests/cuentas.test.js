// HU-07 · cuentas propias, HU-25 · moneda y saldo inicial y lectura de administrador (HU-04, HU-05, HU-22).
import mongoose from 'mongoose';
import request from 'supertest';
import { ROLES } from '@finanzas/shared';
import { iniciarEntorno } from './helpers/api.js';

const NO_EXISTE = 'El recurso solicitado no existe o no tienes permiso para acceder a él';
const DUPLICADA = 'Ya existe una cuenta con ese nombre';
const CON_MOVIMIENTOS = 'No se puede eliminar una cuenta con movimientos asociados';
const MONEDA_CON_MOVIMIENTOS = 'No se puede cambiar la moneda de una cuenta con movimientos asociados';
const Decimal128 = mongoose.Types.Decimal128;

describe('cuentas', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const cuentas = () => mongoose.connection.collection('cuentas');
  const movimientos = () => mongoose.connection.collection('movimientos');
  const usuarios = () => mongoose.connection.collection('usuarios');
  const id = (valor) => new mongoose.Types.ObjectId(valor);

  async function sesion() {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    return { u, agente };
  }
  const crear = (agente, datos) => agente.post('/api/v1/cuentas').send(datos);
  const visa = { nombre: 'Visa Principal', tipo: 'tarjeta_credito', moneda: 'PEN', saldoInicial: '0' };
  const listar = async (agente, consulta = '?limit=100') =>
    (await agente.get(`/api/v1/cuentas${consulta}`)).body.data;

  /** Cuenta con un movimiento asociado (como la dejará la épica de movimientos). */
  async function cuentaConMovimientos(agente, u, datos = {}) {
    const res = await crear(agente, { nombre: 'Ahorros', tipo: 'banco', moneda: 'USD', saldoInicial: '100', ...datos });
    const usuario = await usuarios().findOne({ email: u.email });
    await movimientos().insertOne({ tenantId: usuario.tenantId, cuentaId: id(res.body.data.id) });
    return res.body.data;
  }

  describe('HU-07 · administrar cuentas', () => {
    it('Registro exitoso: queda vinculada a su tenantId y usuarioId, con saldo actual igual al inicial', async () => {
      const { u, agente } = await sesion();
      const res = await crear(agente, { ...visa, nombre: '  Visa Principal ' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        nombre: 'Visa Principal',
        tipo: 'tarjeta_credito',
        moneda: 'PEN',
        saldoInicial: '0.00',
        saldoActual: '0.00',
      });

      const usuario = await usuarios().findOne({ email: u.email });
      const guardada = await cuentas().findOne({ _id: id(res.body.data.id) });
      expect(guardada.tenantId).toBe(usuario.tenantId);
      expect(String(guardada.usuarioId)).toBe(String(usuario._id));
      // Los importes se guardan como Decimal128, no como número.
      expect(guardada.saldoInicial).toBeInstanceOf(Decimal128);
      expect((await listar(agente)).map((c) => c.nombre)).toEqual(['Visa Principal']);
    });

    it('Registro rechazado por nombre vacío: 400 con "El nombre de la cuenta es obligatorio"', async () => {
      const { agente } = await sesion();
      for (const nombre of ['', '   ', undefined]) {
        const res = await crear(agente, { ...visa, nombre });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details).toContainEqual({
          campo: 'nombre',
          mensaje: 'El nombre de la cuenta es obligatorio',
        });
      }
      expect((await listar(agente))).toHaveLength(0);
    });

    it('Validación: nombre de 2 a 50 caracteres y tipo válido', async () => {
      const { agente } = await sesion();
      for (const datos of [
        { ...visa, nombre: 'x' },
        { ...visa, nombre: 'x'.repeat(51) },
        { ...visa, tipo: 'otro' },
        { ...visa, tipo: undefined },
      ]) {
        expect((await crear(agente, datos)).status).toBe(400);
      }
    });

    it('Nombre duplicado: 409 con el mensaje exacto, sin distinguir mayúsculas ni tildes', async () => {
      const { agente } = await sesion();
      await crear(agente, { ...visa, nombre: 'Crédito' });
      for (const nombre of ['Crédito', 'crédito', 'CREDITO', ' Credito ']) {
        const res = await crear(agente, { ...visa, nombre });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: DUPLICADA });
      }
    });

    it('Dos usuarios pueden tener una cuenta con el mismo nombre', async () => {
      const a = await sesion();
      const b = await sesion();
      expect((await crear(a.agente, visa)).status).toBe(201);
      expect((await crear(b.agente, visa)).status).toBe(201);
    });

    it('Dos creaciones simultáneas con el mismo nombre dejan una sola cuenta', async () => {
      const { agente } = await sesion();
      const respuestas = await Promise.all(Array.from({ length: 4 }, () => crear(agente, visa)));
      expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
      expect(respuestas.filter((r) => r.status === 409)).toHaveLength(3);
      expect(await listar(agente)).toHaveLength(1);
    });

    it('Edición exitosa: cambia nombre y tipo y los movimientos asociados siguen intactos', async () => {
      const { u, agente } = await sesion();
      const efectivo = (await crear(agente, { nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN' })).body.data;
      const usuario = await usuarios().findOne({ email: u.email });
      await movimientos().insertOne({ tenantId: usuario.tenantId, cuentaId: id(efectivo.id), monto: 5 });

      const res = await agente.patch(`/api/v1/cuentas/${efectivo.id}`).send({ nombre: 'Efectivo Personal' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ nombre: 'Efectivo Personal', tipo: 'efectivo', moneda: 'PEN' });
      const movimiento = await movimientos().findOne({ cuentaId: id(efectivo.id) });
      expect(movimiento).toMatchObject({ monto: 5 });
      expect(String(movimiento.cuentaId)).toBe(efectivo.id);

      const tipo = await agente.patch(`/api/v1/cuentas/${efectivo.id}`).send({ tipo: 'billetera_digital' });
      expect(tipo.body.data.tipo).toBe('billetera_digital');
    });

    it('Edición: renombrar a un nombre existente responde 409, y una edición vacía o inválida responde 400', async () => {
      const { agente } = await sesion();
      await crear(agente, { ...visa, nombre: 'Uno' });
      const dos = (await crear(agente, { ...visa, nombre: 'Dos' })).body.data;
      const repetido = await agente.patch(`/api/v1/cuentas/${dos.id}`).send({ nombre: 'uno' });
      expect(repetido.status).toBe(409);
      expect(repetido.body.error.message).toBe(DUPLICADA);

      expect((await agente.patch(`/api/v1/cuentas/${dos.id}`).send({})).status).toBe(400);
      expect((await agente.patch(`/api/v1/cuentas/${dos.id}`).send({ nombre: 'x' })).status).toBe(400);
      expect((await agente.get(`/api/v1/cuentas/${dos.id}`)).body.data.nombre).toBe('Dos');
    });

    it('Eliminación impedida por movimientos asociados: 409 con el mensaje exacto y la cuenta se conserva', async () => {
      const { u, agente } = await sesion();
      const cuenta = await cuentaConMovimientos(agente, u);
      const res = await agente.delete(`/api/v1/cuentas/${cuenta.id}`);
      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: CON_MOVIMIENTOS });
      expect((await listar(agente)).map((c) => c.id)).toContain(cuenta.id);
    });

    it('Eliminación exitosa de una cuenta sin movimientos, y los movimientos de otro inquilino no la bloquean', async () => {
      const { agente } = await sesion();
      const cuenta = (await crear(agente, visa)).body.data;
      await movimientos().insertOne({ tenantId: 'otro-inquilino', cuentaId: id(cuenta.id) });
      expect((await agente.delete(`/api/v1/cuentas/${cuenta.id}`)).status).toBe(204);
      expect(await listar(agente)).toHaveLength(0);
      expect((await agente.delete(`/api/v1/cuentas/${cuenta.id}`)).status).toBe(404);
    });

    it('Listado: paginado, filtrable por tipo y moneda y ordenado por nombre sin distinguir tildes', async () => {
      const { agente } = await sesion();
      await crear(agente, { nombre: 'Zeta', tipo: 'efectivo', moneda: 'PEN' });
      await crear(agente, { nombre: 'Ábaco', tipo: 'banco', moneda: 'USD' });
      await crear(agente, { nombre: 'Mil', tipo: 'banco', moneda: 'PEN' });

      const res = await agente.get('/api/v1/cuentas?limit=100');
      expect(res.body.data.map((c) => c.nombre)).toEqual(['Ábaco', 'Mil', 'Zeta']);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 100, total: 3, totalPages: 1 });
      expect((await listar(agente, '?tipo=banco')).map((c) => c.nombre)).toEqual(['Ábaco', 'Mil']);
      expect((await listar(agente, '?moneda=usd')).map((c) => c.nombre)).toEqual(['Ábaco']);
      const pagina = await agente.get('/api/v1/cuentas?limit=2&page=2');
      expect(pagina.body.data.map((c) => c.nombre)).toEqual(['Zeta']);
      expect(pagina.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
      expect((await agente.get('/api/v1/cuentas?moneda=GBP')).status).toBe(400);
      expect((await agente.get('/api/v1/cuentas?limit=500')).status).toBe(400);
    });

    it('Un usuario nuevo no tiene cuentas y exige sesión', async () => {
      const { agente } = await sesion();
      expect(await listar(agente)).toEqual([]);
      expect((await request(e.app).get('/api/v1/cuentas')).status).toBe(401);
    });
  });

  describe('HU-25 · moneda y saldo inicial', () => {
    it('Cuenta creada en otra moneda: USD con saldo 200.00', async () => {
      const { agente } = await sesion();
      const res = await crear(agente, { nombre: 'Dólares', tipo: 'banco', moneda: 'usd', saldoInicial: '200.00' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ moneda: 'USD', saldoInicial: '200.00', saldoActual: '200.00' });
    });

    it('Moneda no seleccionada: 400 con "La moneda es obligatoria"; una no soportada dice "Selecciona una moneda válida"', async () => {
      const { agente } = await sesion();
      const sinMoneda = await crear(agente, { ...visa, moneda: '' });
      expect(sinMoneda.status).toBe(400);
      expect(sinMoneda.body.error.details).toContainEqual({ campo: 'moneda', mensaje: 'La moneda es obligatoria' });
      const mala = await crear(agente, { ...visa, moneda: 'GBP' });
      expect(mala.body.error.details).toContainEqual({ campo: 'moneda', mensaje: 'Selecciona una moneda válida' });
      expect(await listar(agente)).toHaveLength(0);
    });

    it('El saldo inicial puede ser negativo, vale 0.00 por defecto y valida decimales y máximo', async () => {
      const { agente } = await sesion();
      const deuda = await crear(agente, { ...visa, saldoInicial: '-1500.5' });
      expect(deuda.body.data).toMatchObject({ saldoInicial: '-1500.50', saldoActual: '-1500.50' });
      const sin = await crear(agente, { nombre: 'Sin saldo', tipo: 'efectivo', moneda: 'PEN' });
      expect(sin.body.data.saldoInicial).toBe('0.00');
      for (const saldoInicial of ['10.123', 'abc', '1000000000']) {
        expect((await crear(agente, { ...visa, nombre: `X${saldoInicial}`, saldoInicial })).status).toBe(400);
      }
    });

    it('Corrección del saldo inicial: de 100.00 a 120.00 con saldo actual 70.00 deja el actual en 90.00 y no toca los movimientos', async () => {
      const { u, agente } = await sesion();
      const cuenta = await cuentaConMovimientos(agente, u, { saldoInicial: '100.00' });
      // Estado como lo dejarían los movimientos: saldo inicial 100.00 y saldo actual 70.00.
      await cuentas().updateOne({ _id: id(cuenta.id) }, { $set: { saldoActual: Decimal128.fromString('70.00') } });
      const antes = await movimientos().find({ cuentaId: id(cuenta.id) }).toArray();

      const res = await agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ saldoInicial: '120.00' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ saldoInicial: '120.00', saldoActual: '90.00' });
      expect(await movimientos().find({ cuentaId: id(cuenta.id) }).toArray()).toEqual(antes);
    });

    it('Corrección con decimales y saldos negativos, sin errores de coma flotante', async () => {
      const { agente } = await sesion();
      const cuenta = (await crear(agente, { nombre: 'Decimales', tipo: 'banco', moneda: 'PEN', saldoInicial: '0.10' })).body
        .data;
      await cuentas().updateOne({ _id: id(cuenta.id) }, { $set: { saldoActual: Decimal128.fromString('0.30') } });
      const a = await agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ saldoInicial: '0.20' });
      expect(a.body.data).toMatchObject({ saldoInicial: '0.20', saldoActual: '0.40' });
      const b = await agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ saldoInicial: '-1000.05' });
      expect(b.body.data).toMatchObject({ saldoInicial: '-1000.05', saldoActual: '-999.85' });
    });

    it('Dos correcciones simultáneas dejan el saldo actual coherente con el saldo inicial', async () => {
      const { agente } = await sesion();
      const cuenta = (await crear(agente, { nombre: 'Carrera', tipo: 'banco', moneda: 'PEN', saldoInicial: '100.00' })).body
        .data;
      await cuentas().updateOne({ _id: id(cuenta.id) }, { $set: { saldoActual: Decimal128.fromString('70.00') } });
      const respuestas = await Promise.all(
        ['150.00', '200.00', '50.00', '300.00'].map((saldoInicial) =>
          agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ saldoInicial }),
        ),
      );
      expect(respuestas.every((r) => r.status === 200)).toBe(true);
      const final = (await agente.get(`/api/v1/cuentas/${cuenta.id}`)).body.data;
      // La diferencia entre el saldo actual y el inicial (−30.00) nunca cambia con las correcciones.
      expect(Number(final.saldoActual) - Number(final.saldoInicial)).toBe(-30);
    });

    it('Cambio de moneda impedido en una cuenta con movimientos: 409 con el mensaje exacto y la cuenta no cambia', async () => {
      const { u, agente } = await sesion();
      const cuenta = await cuentaConMovimientos(agente, u);
      const res = await agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ moneda: 'PEN' });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: MONEDA_CON_MOVIMIENTOS });
      expect((await agente.get(`/api/v1/cuentas/${cuenta.id}`)).body.data.moneda).toBe('USD');
    });

    it('Con movimientos: enviar la misma moneda se acepta y el resto de campos se puede editar', async () => {
      const { u, agente } = await sesion();
      const cuenta = await cuentaConMovimientos(agente, u);
      const res = await agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ moneda: 'usd', nombre: 'Ahorros USD' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ moneda: 'USD', nombre: 'Ahorros USD' });
    });

    it('Sin movimientos la moneda sí cambia y el saldo se conserva', async () => {
      const { agente } = await sesion();
      const cuenta = (await crear(agente, { nombre: 'Libre', tipo: 'banco', moneda: 'USD', saldoInicial: '50' })).body.data;
      const res = await agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ moneda: 'PEN' });
      expect(res.body.data).toMatchObject({ moneda: 'PEN', saldoInicial: '50.00', saldoActual: '50.00' });
    });
  });

  describe('HU-07 / HU-05 · aislamiento entre usuarios', () => {
    it('Otra persona no ve, edita ni elimina una cuenta ajena aunque conozca su id (404 genérico)', async () => {
      const a = await sesion();
      const b = await sesion();
      const deA = (await crear(a.agente, visa)).body.data;

      expect(await listar(b.agente)).toEqual([]);
      const respuestas = [
        await b.agente.get(`/api/v1/cuentas/${deA.id}`),
        await b.agente.patch(`/api/v1/cuentas/${deA.id}`).send({ nombre: 'Hackeada' }),
        await b.agente.delete(`/api/v1/cuentas/${deA.id}`),
      ];
      for (const res of respuestas) {
        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe(NO_EXISTE);
      }
      expect((await a.agente.get(`/api/v1/cuentas/${deA.id}`)).body.data.nombre).toBe('Visa Principal');
    });

    it('El cuerpo no puede fijar tenantId ni usuarioId, y un id inválido responde 404', async () => {
      const a = await sesion();
      const b = await sesion();
      const usuarioB = await usuarios().findOne({ email: b.u.email });
      const res = await crear(a.agente, { ...visa, tenantId: usuarioB.tenantId, usuarioId: String(usuarioB._id) });
      expect(res.status).toBe(201);
      expect((await cuentas().findOne({ _id: id(res.body.data.id) })).tenantId).not.toBe(usuarioB.tenantId);
      expect(await listar(b.agente)).toEqual([]);
      expect((await a.agente.delete('/api/v1/cuentas/no-es-un-id')).status).toBe(404);
    });
  });
});

describe('HU-04 · HU-05 · HU-22 · lectura de cuentas por administración', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const usuarios = () => mongoose.connection.collection('usuarios');
  async function sesion(rol = ROLES.USUARIO) {
    const u = await e.registrar();
    if (rol !== ROLES.USUARIO) {
      await usuarios().updateOne({ _id: new mongoose.Types.ObjectId(u.id) }, { $set: { rol } });
    }
    const { agente } = await e.iniciarSesion(u);
    return { u, agente };
  }
  const deUsuario = (agente, usuarioId, consulta = '?limit=100') =>
    agente.get(`/api/v1/admin/usuarios/${usuarioId}/cuentas${consulta}`);
  const nueva = (agente, nombre, extra = {}) =>
    agente.post('/api/v1/cuentas').send({ nombre, tipo: 'banco', moneda: 'PEN', saldoInicial: '10', ...extra });

  it('HU-04 · el administrador consulta las cuentas de cualquier usuario', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const luis = await sesion();
    await nueva(ana.agente, 'Sueldo');
    await nueva(ana.agente, 'Dólares', { moneda: 'USD' });
    await nueva(luis.agente, 'Efectivo', { tipo: 'efectivo' });

    const deAna = await deUsuario(admin.agente, ana.u.id);
    expect(deAna.status).toBe(200);
    expect(deAna.body.data.map((c) => c.nombre)).toEqual(['Dólares', 'Sueldo']);
    expect(deAna.body.data[0]).toMatchObject({ moneda: 'USD', saldoActual: '10.00' });
    expect(deAna.body.meta).toMatchObject({ total: 2, page: 1 });
    expect((await deUsuario(admin.agente, luis.u.id)).body.data.map((c) => c.nombre)).toEqual(['Efectivo']);
    expect((await deUsuario(admin.agente, ana.u.id, '?moneda=USD')).body.data).toHaveLength(1);
  });

  it('HU-04 · un usuario estándar recibe 403 en la lectura de administración, incluso de sus propias cuentas', async () => {
    const ana = await sesion();
    const luis = await sesion();
    for (const usuarioId of [ana.u.id, luis.u.id]) {
      const res = await deUsuario(ana.agente, usuarioId);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({ code: 'FORBIDDEN', message: 'Acceso no autorizado' });
    }
  });

  it('HU-22 · un usuario inexistente o con id inválido responde 404 y uno sin cuentas devuelve la lista vacía', async () => {
    const admin = await sesion(ROLES.ADMIN);
    expect((await deUsuario(admin.agente, '65f000000000000000000000')).status).toBe(404);
    expect((await deUsuario(admin.agente, 'no-es-un-id')).status).toBe(404);

    const vacio = await sesion();
    const res = await deUsuario(admin.agente, vacio.u.id);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('HU-22 · el administrador no puede modificar cuentas ajenas: PATCH y DELETE responden 404 y nada cambia', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const cuenta = (await nueva(ana.agente, 'Intocable')).body.data;
    const antes = (await deUsuario(admin.agente, ana.u.id)).body.data;

    const editar = await admin.agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ nombre: 'Tomada' });
    const borrar = await admin.agente.delete(`/api/v1/cuentas/${cuenta.id}`);
    const crear = await admin.agente
      .post(`/api/v1/admin/usuarios/${ana.u.id}/cuentas`)
      .send({ nombre: 'Impuesta', tipo: 'banco', moneda: 'PEN' });
    expect([editar.status, borrar.status, crear.status]).toEqual([404, 404, 404]);
    expect(editar.body.error.message).toBe(NO_EXISTE);
    expect((await deUsuario(admin.agente, ana.u.id)).body.data).toEqual(antes);
  });

  it('HU-05 · el administrador conserva su propio aislamiento y un usuario no ve las cuentas de otro', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const luis = await sesion();
    await nueva(admin.agente, 'De la admin');
    const deAna = (await nueva(ana.agente, 'De Ana')).body.data;

    const propias = (await admin.agente.get('/api/v1/cuentas?limit=100')).body.data;
    expect(propias.map((c) => c.nombre)).toEqual(['De la admin']);
    expect((await luis.agente.get('/api/v1/cuentas?limit=100')).body.data).toEqual([]);
    const robo = await luis.agente.patch(`/api/v1/cuentas/${deAna.id}`).send({ nombre: 'Robada' });
    expect(robo.status).toBe(404);
  });
});
