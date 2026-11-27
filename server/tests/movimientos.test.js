// HU-08, HU-09 · registrar, editar y eliminar; HU-26 · saldo consistente; HU-27 · coherencia del movimiento;
// y lectura de administrador (HU-04, HU-05, HU-22).
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { ROLES } from '@finanzas/shared';
import { RepositorioBase } from '../src/repositories/base.repository.js';
import { verificarSaldos } from '../scripts/verificar-saldos.js';
import { iniciarEntorno } from './helpers/api.js';

const NO_EXISTE = 'El recurso solicitado no existe o no tienes permiso para acceder a él';
const HOY = '2026-01-15'; // el reloj manual de las pruebas arranca el 15/01/2026 (mediodía UTC)
const Decimal128 = mongoose.Types.Decimal128;

describe('movimientos', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());
  afterEach(() => jest.restoreAllMocks());

  const coleccion = (nombre) => mongoose.connection.collection(nombre);
  const oid = (valor) => new mongoose.Types.ObjectId(valor);

  /** Una persona con sesión, sus categorías predeterminadas y una función para crear cuentas. */
  async function preparar() {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const categorias = (await agente.get('/api/v1/categorias?limit=100')).body.data;
    const gastos = categorias.filter((c) => c.tipo === 'gasto');
    const ingresos = categorias.filter((c) => c.tipo === 'ingreso');
    const cuenta = async (nombre = 'Efectivo', moneda = 'PEN', saldoInicial = '500') =>
      (await agente.post('/api/v1/cuentas').send({ nombre, tipo: 'efectivo', moneda, saldoInicial })).body.data;
    return { u, agente, gasto: gastos[0], gasto2: gastos[1], ingreso: ingresos[0], cuenta };
  }

  const registrar = (agente, datos) => agente.post('/api/v1/movimientos').send(datos);
  const saldo = async (agente, cuentaId) => (await agente.get(`/api/v1/cuentas/${cuentaId}`)).body.data.saldoActual;
  const listar = async (agente, consulta = '?limit=100&sort=fecha') =>
    (await agente.get(`/api/v1/movimientos${consulta}`)).body;
  const gastoDe = (p, cuenta, monto, extra = {}) => ({
    tipo: 'gasto',
    monto,
    fecha: HOY,
    categoriaId: p.gasto.id,
    cuentaId: cuenta.id,
    descripcion: 'Compra',
    ...extra,
  });
  const ingresoDe = (p, cuenta, monto, extra = {}) => ({
    tipo: 'ingreso',
    monto,
    fecha: HOY,
    categoriaId: p.ingreso.id,
    cuentaId: cuenta.id,
    ...extra,
  });

  const indicadores = async (agente) => (await agente.get('/api/v1/dashboard/indicadores')).body.data;
  const evolucionDelMes = async (agente) => (await agente.get('/api/v1/dashboard/graficos')).body.data.evolucion.at(-1);

  describe('HU-08 · registrar un movimiento', () => {
    it('Registro exitoso: guarda el gasto con su usuario y tenant, y descuenta el saldo de la cuenta', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const res = await registrar(p.agente, gastoDe(p, cuenta, '150.00', { descripcion: '  Almuerzo ' }));

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        tipo: 'gasto',
        monto: '150.00',
        moneda: 'PEN',
        fecha: HOY,
        categoriaId: p.gasto.id,
        cuentaId: cuenta.id,
        descripcion: 'Almuerzo',
      });
      expect(res.body.meta).toBeUndefined();
      expect(await saldo(p.agente, cuenta.id)).toBe('350.00');

      const usuario = await coleccion('usuarios').findOne({ email: p.u.email });
      const guardado = await coleccion('movimientos').findOne({ _id: oid(res.body.data.id) });
      expect(guardado.tenantId).toBe(usuario.tenantId);
      expect(String(guardado.usuarioId)).toBe(String(usuario._id));
      expect(guardado.monto).toBeInstanceOf(Decimal128); // nunca un número
      expect(guardado.fecha.toISOString()).toBe(`${HOY}T00:00:00.000Z`);
    });

    it('Un ingreso suma al saldo de la cuenta', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      expect((await registrar(p.agente, ingresoDe(p, cuenta, '75.25'))).status).toBe(201);
      expect(await saldo(p.agente, cuenta.id)).toBe('575.25');
    });

    it('Actualización automática de indicadores tras registrar un ingreso: balance, gráfico y resumen del mes', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await registrar(p.agente, gastoDe(p, cuenta, '200'));
      expect(await indicadores(p.agente)).toMatchObject({ ingresos: '0.00', gastos: '200.00', balance: '-200.00' });

      expect((await registrar(p.agente, ingresoDe(p, cuenta, '1500'))).status).toBe(201);
      expect(await indicadores(p.agente)).toMatchObject({ ingresos: '1500.00', gastos: '200.00', balance: '1300.00' });
      expect(await evolucionDelMes(p.agente)).toEqual({ periodo: '2026-01', ingresos: '1500.00', gastos: '200.00' });
    });

    it('Registro rechazado por monto o fecha inválidos: 400 con los mensajes y sin tocar el saldo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      for (const monto of ['-5', '0', '', '10.999', 'abc', '1000000000']) {
        const res = await registrar(p.agente, gastoDe(p, cuenta, monto));
        expect([monto, res.status]).toEqual([monto, 400]);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details.map((d) => d.campo)).toEqual(['monto']);
      }
      const doble = await registrar(p.agente, gastoDe(p, cuenta, '0', { fecha: '' }));
      expect(doble.body.error.details).toEqual([
        { campo: 'monto', mensaje: 'El monto debe ser mayor a 0, con hasta 2 decimales' },
        { campo: 'fecha', mensaje: 'La fecha es obligatoria' },
      ]);
      expect((await registrar(p.agente, gastoDe(p, cuenta, '5', { fecha: '15/01/2026' }))).status).toBe(400);
      expect((await registrar(p.agente, gastoDe(p, cuenta, '5', { descripcion: 'x'.repeat(256) }))).status).toBe(400);
      expect((await registrar(p.agente, gastoDe(p, cuenta, '5', { tipo: 'transferencia' }))).status).toBe(400);
      expect(await saldo(p.agente, cuenta.id)).toBe('500.00');
      expect((await listar(p.agente)).meta.total).toBe(0);
    });

    it('Registro permitido con saldo insuficiente: se guarda y la respuesta lleva la advertencia', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Corta', 'PEN', '100');
      const res = await registrar(p.agente, gastoDe(p, cuenta, '150.00'));
      expect(res.status).toBe(201);
      expect(res.body.meta).toEqual({ advertencias: ['El monto excede el saldo disponible de la cuenta'] });
      expect(await saldo(p.agente, cuenta.id)).toBe('-50.00');

      const suficiente = await p.cuenta('Larga', 'PEN', '100');
      const normal = await registrar(p.agente, gastoDe(p, suficiente, '100.00'));
      expect(normal.status).toBe(201);
      expect(normal.body.meta).toBeUndefined(); // un gasto igual al saldo no lo excede
    });

    it('Exige sesión y el cuerpo nunca fija tenantId, usuarioId ni moneda', async () => {
      expect((await request(e.app).post('/api/v1/movimientos').send({})).status).toBe(401);
      const a = await preparar();
      const b = await preparar();
      const cuenta = await a.cuenta('Soles', 'PEN');
      const usuarioB = await coleccion('usuarios').findOne({ email: b.u.email });
      const res = await registrar(
        a.agente,
        gastoDe(a, cuenta, '10', { tenantId: usuarioB.tenantId, usuarioId: String(usuarioB._id), moneda: 'EUR' }),
      );
      expect(res.status).toBe(201);
      expect(res.body.data.moneda).toBe('PEN');
      const guardado = await coleccion('movimientos').findOne({ _id: oid(res.body.data.id) });
      expect(guardado.tenantId).not.toBe(usuarioB.tenantId);
      expect((await listar(b.agente)).data).toEqual([]);
    });

    it('Consulta de un movimiento propio; uno ajeno o un id inválido responde 404', async () => {
      const a = await preparar();
      const b = await preparar();
      const cuenta = await a.cuenta();
      const mov = (await registrar(a.agente, gastoDe(a, cuenta, '10'))).body.data;
      expect((await a.agente.get(`/api/v1/movimientos/${mov.id}`)).body.data.monto).toBe('10.00');
      for (const res of [
        await b.agente.get(`/api/v1/movimientos/${mov.id}`),
        await a.agente.get('/api/v1/movimientos/no-es-un-id'),
      ]) {
        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe(NO_EXISTE);
      }
    });
  });

  describe('HU-09 · editar y eliminar', () => {
    it('Edición exitosa: cambia monto, categoría y descripción y recalcula el saldo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '40'))).body.data;
      expect(await saldo(p.agente, cuenta.id)).toBe('460.00');

      const res = await p.agente
        .patch(`/api/v1/movimientos/${mov.id}`)
        .send({ monto: '60.50', categoriaId: p.gasto2.id, descripcion: 'Corregido' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ monto: '60.50', categoriaId: p.gasto2.id, descripcion: 'Corregido' });
      expect(await saldo(p.agente, cuenta.id)).toBe('439.50');
    });

    it('Edición exitosa: el dashboard recalcula los indicadores con el monto nuevo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '40'))).body.data;
      expect((await indicadores(p.agente)).gastos).toBe('40.00');
      await p.agente.patch(`/api/v1/movimientos/${mov.id}`).send({ monto: '60.50' });
      expect(await indicadores(p.agente)).toMatchObject({ gastos: '60.50', balance: '-60.50' });
    });

    it('Eliminación exitosa: actualiza el historial, el dashboard y el seguimiento del presupuesto', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await p.agente.post('/api/v1/presupuestos').send({ periodo: '2026-01', moneda: 'PEN', monto: '1000' });
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '400'))).body.data;
      const avance = async () =>
        (await p.agente.get('/api/v1/presupuestos/seguimiento?periodo=2026-01')).body.data[0];
      expect(await avance()).toMatchObject({ gastado: '400.00', porcentaje: 40 });

      expect((await p.agente.delete(`/api/v1/movimientos/${mov.id}`)).status).toBe(204);
      expect((await listar(p.agente)).meta.total).toBe(0);
      expect(await indicadores(p.agente)).toMatchObject({ gastos: '0.00', hayMovimientos: false });
      expect(await avance()).toMatchObject({ gastado: '0.00', porcentaje: 0 });
    });

    it('Edición rechazada por datos inválidos: 400 y el registro y el saldo no cambian', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '40'))).body.data;
      const editar = (cuerpo) => p.agente.patch(`/api/v1/movimientos/${mov.id}`).send(cuerpo);

      const cero = await editar({ monto: '0' });
      expect(cero.status).toBe(400);
      expect(cero.body.error.details[0]).toEqual({
        campo: 'monto',
        mensaje: 'El monto debe ser mayor a 0, con hasta 2 decimales',
      });
      expect((await editar({ monto: '-3' })).status).toBe(400);
      const sinFecha = await editar({ fecha: '' });
      expect(sinFecha.body.error.details).toEqual([{ campo: 'fecha', mensaje: 'La fecha es obligatoria' }]);
      expect((await editar({})).status).toBe(400);
      expect((await editar({ descripcion: 'x'.repeat(256) })).status).toBe(400);

      expect((await p.agente.get(`/api/v1/movimientos/${mov.id}`)).body.data).toMatchObject({ monto: '40.00', fecha: HOY });
      expect(await saldo(p.agente, cuenta.id)).toBe('460.00');
    });

    it('Edición de la fecha y cambio de tipo: el saldo refleja el nuevo efecto', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '40'))).body.data;
      const res = await p.agente
        .patch(`/api/v1/movimientos/${mov.id}`)
        .send({ tipo: 'ingreso', categoriaId: p.ingreso.id, fecha: '2026-01-10' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ tipo: 'ingreso', fecha: '2026-01-10' });
      expect(await saldo(p.agente, cuenta.id)).toBe('540.00'); // 500 + 40 (el gasto de −40 se revirtió y el ingreso suma)
    });

    it('Eliminación exitosa: borra el movimiento y revierte su efecto en el saldo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '120'))).body.data;
      expect(await saldo(p.agente, cuenta.id)).toBe('380.00');
      expect((await p.agente.delete(`/api/v1/movimientos/${mov.id}`)).status).toBe(204);
      expect(await saldo(p.agente, cuenta.id)).toBe('500.00');
      expect((await p.agente.get(`/api/v1/movimientos/${mov.id}`)).status).toBe(404);
      expect((await p.agente.delete(`/api/v1/movimientos/${mov.id}`)).status).toBe(404);
    });

    it('Operación rechazada sobre un movimiento de otro usuario: 404 y nada cambia', async () => {
      const a = await preparar();
      const b = await preparar();
      const cuenta = await a.cuenta();
      const mov = (await registrar(a.agente, gastoDe(a, cuenta, '40'))).body.data;

      const editar = await b.agente.patch(`/api/v1/movimientos/${mov.id}`).send({ monto: '1' });
      const borrar = await b.agente.delete(`/api/v1/movimientos/${mov.id}`);
      for (const res of [editar, borrar]) {
        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe(NO_EXISTE);
      }
      expect((await a.agente.get(`/api/v1/movimientos/${mov.id}`)).body.data.monto).toBe('40.00');
      expect(await saldo(a.agente, cuenta.id)).toBe('460.00');
    });
  });

  describe('HU-26 · saldo consistente', () => {
    it('Saldo coherente tras varias operaciones: 100.00 + 50.00 − 30.00 y eliminar el ingreso deja 70.00', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Efectivo', 'PEN', '100.00');
      const ingreso = (await registrar(p.agente, ingresoDe(p, cuenta, '50.00'))).body.data;
      await registrar(p.agente, gastoDe(p, cuenta, '30.00'));
      expect(await saldo(p.agente, cuenta.id)).toBe('120.00');
      await p.agente.delete(`/api/v1/movimientos/${ingreso.id}`);
      expect(await saldo(p.agente, cuenta.id)).toBe('70.00');
    });

    it('Los decimales no pierden exactitud (0.10 y 0.20 no dan 0.30000000000000004)', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Centavos', 'PEN', '0.30');
      await registrar(p.agente, gastoDe(p, cuenta, '0.10'));
      await registrar(p.agente, gastoDe(p, cuenta, '0.20'));
      expect(await saldo(p.agente, cuenta.id)).toBe('0.00');
    });

    it('Operaciones simultáneas sobre la misma cuenta dejan el saldo igual a la fórmula', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Carrera', 'PEN', '100.00');
      const respuestas = await Promise.all([
        ...Array.from({ length: 5 }, () => registrar(p.agente, gastoDe(p, cuenta, '10.00'))),
        ...Array.from({ length: 3 }, () => registrar(p.agente, ingresoDe(p, cuenta, '5.50'))),
      ]);
      expect(respuestas.every((r) => r.status === 201)).toBe(true);
      expect(await saldo(p.agente, cuenta.id)).toBe('66.50'); // 100 − 50 + 16.50
      const { diferencias } = await verificarSaldos();
      expect(diferencias.filter((d) => d.id === cuenta.id)).toEqual([]);
    });

    it('Si el saldo guardado no coincide con la fórmula, la operación lo corrige', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Alterada', 'PEN', '100.00');
      await coleccion('cuentas').updateOne({ _id: oid(cuenta.id) }, { $set: { saldoActual: Decimal128.fromString('999.00') } });
      await registrar(p.agente, gastoDe(p, cuenta, '10.00'));
      expect(await saldo(p.agente, cuenta.id)).toBe('90.00');
    });

    it('Saldo resultante en el historial: por fecha y orden de registro, igual con y sin filtros', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Efectivo', 'PEN', '100.00');
      await registrar(p.agente, ingresoDe(p, cuenta, '50.00', { fecha: '2026-01-10' }));
      await registrar(p.agente, gastoDe(p, cuenta, '30.00', { fecha: '2026-01-12' }));
      await registrar(p.agente, gastoDe(p, cuenta, '20.00', { fecha: '2026-01-12' }));

      const todos = await listar(p.agente);
      expect(todos.data.map((m) => [m.tipo, m.monto, m.saldoResultante])).toEqual([
        ['ingreso', '50.00', '150.00'],
        ['gasto', '30.00', '120.00'],
        ['gasto', '20.00', '100.00'],
      ]);
      const filtrado = await listar(p.agente, '?limit=100&sort=fecha&tipo=gasto');
      expect(filtrado.data.map((m) => m.saldoResultante)).toEqual(['120.00', '100.00']);
      const recientes = await listar(p.agente, '?limit=100&sort=-fecha');
      expect(recientes.data[0].saldoResultante).toBe('100.00'); // el último movimiento deja el saldo actual
      expect(await saldo(p.agente, cuenta.id)).toBe('100.00');
    });

    it('Cada cuenta lleva su propio saldo resultante', async () => {
      const p = await preparar();
      const uno = await p.cuenta('Uno', 'PEN', '10.00');
      const dos = await p.cuenta('Dos', 'USD', '1000.00');
      await registrar(p.agente, gastoDe(p, uno, '4.00'));
      await registrar(p.agente, gastoDe(p, dos, '100.00'));
      const { data } = await listar(p.agente);
      const porCuenta = Object.fromEntries(data.map((m) => [m.cuentaId, m.saldoResultante]));
      expect(porCuenta).toEqual({ [uno.id]: '6.00', [dos.id]: '900.00' });
    });

    it('Registro interrumpido: si algo falla a mitad, no queda el movimiento ni el cambio de saldo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Interrumpida', 'PEN', '70.00');
      jest.spyOn(RepositorioBase.prototype, 'actualizarPorId').mockRejectedValueOnce(new Error('conexión perdida'));
      const fallido = await registrar(p.agente, gastoDe(p, cuenta, '20.00'));
      expect(fallido.status).toBe(500);
      expect((await listar(p.agente)).meta.total).toBe(0);
      expect(await saldo(p.agente, cuenta.id)).toBe('70.00');

      jest.restoreAllMocks();
      expect((await registrar(p.agente, gastoDe(p, cuenta, '20.00'))).status).toBe(201);
      expect(await saldo(p.agente, cuenta.id)).toBe('50.00');
    });

    it('Movimiento registrado con fecha anterior: recalcula el saldo resultante de los posteriores y el final es correcto', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Efectivo', 'PEN', '100.00');
      await registrar(p.agente, gastoDe(p, cuenta, '10.00', { fecha: '2026-01-12' }));
      await registrar(p.agente, gastoDe(p, cuenta, '5.00', { fecha: '2026-01-14' }));
      await registrar(p.agente, gastoDe(p, cuenta, '20.00', { fecha: '2026-01-05' })); // registrado después, fecha anterior

      const { data } = await listar(p.agente);
      expect(data.map((m) => [m.fecha, m.saldoResultante])).toEqual([
        ['2026-01-05', '80.00'],
        ['2026-01-12', '70.00'],
        ['2026-01-14', '65.00'],
      ]);
      expect(await saldo(p.agente, cuenta.id)).toBe('65.00');
    });

    it('Filtros por fechas, categoría, cuenta y moneda, orden por monto y paginación', async () => {
      const p = await preparar();
      const pen = await p.cuenta('Soles', 'PEN', '1000');
      const usd = await p.cuenta('Dólares', 'USD', '1000');
      await registrar(p.agente, gastoDe(p, pen, '30', { fecha: '2026-01-02' }));
      await registrar(p.agente, gastoDe(p, pen, '10', { fecha: '2026-01-08', categoriaId: p.gasto2.id }));
      await registrar(p.agente, ingresoDe(p, usd, '90', { fecha: '2026-01-09' }));

      const montos = async (consulta) => (await listar(p.agente, `?limit=100&sort=monto&${consulta}`)).data.map((m) => m.monto);
      expect(await montos('desde=2026-01-05')).toEqual(['10.00', '90.00']);
      expect(await montos('hasta=2026-01-05')).toEqual(['30.00']);
      expect(await montos(`categoriaId=${p.gasto2.id}`)).toEqual(['10.00']);
      expect(await montos(`cuentaId=${usd.id}`)).toEqual(['90.00']);
      expect(await montos('moneda=PEN')).toEqual(['10.00', '30.00']);
      expect(await montos('tipo=ingreso')).toEqual(['90.00']);

      const pagina = await listar(p.agente, '?limit=2&page=2&sort=fecha');
      expect(pagina.data).toHaveLength(1);
      expect(pagina.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
      expect((await p.agente.get('/api/v1/movimientos?desde=2026-02-01&hasta=2026-01-01')).status).toBe(400);
    });

    it('verificar-saldos: sin diferencias no lista nada y con un saldo alterado lo señala', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Revisada', 'PEN', '100.00');
      await registrar(p.agente, gastoDe(p, cuenta, '30.00'));
      expect((await verificarSaldos()).diferencias.filter((d) => d.id === cuenta.id)).toEqual([]);

      await coleccion('cuentas').updateOne({ _id: oid(cuenta.id) }, { $set: { saldoActual: Decimal128.fromString('55.00') } });
      const { revisadas, diferencias } = await verificarSaldos();
      expect(revisadas).toBeGreaterThan(0);
      expect(diferencias.filter((d) => d.id === cuenta.id)).toEqual([
        { id: cuenta.id, nombre: 'Revisada', guardado: '55.00', esperado: '70.00' },
      ]);
      await coleccion('cuentas').updateOne({ _id: oid(cuenta.id) }, { $set: { saldoActual: Decimal128.fromString('70.00') } });
    });
  });

  describe('HU-27 · coherencia del movimiento', () => {
    it('Movimiento registrado en la moneda de su cuenta: queda en USD y baja el saldo', async () => {
      const p = await preparar();
      const ahorros = await p.cuenta('Ahorros USD', 'USD', '200.00');
      const res = await registrar(p.agente, gastoDe(p, ahorros, '40.00'));
      expect(res.body.data.moneda).toBe('USD');
      expect(await saldo(p.agente, ahorros.id)).toBe('160.00');
    });

    it('Cambio de cuenta al editar: pasa a PEN, la anterior sube 40.00 y la nueva baja 40.00', async () => {
      const p = await preparar();
      const ahorros = await p.cuenta('Ahorros USD', 'USD', '200.00');
      const efectivo = await p.cuenta('Efectivo', 'PEN', '100.00');
      const mov = (await registrar(p.agente, gastoDe(p, ahorros, '40.00'))).body.data;
      expect(await saldo(p.agente, ahorros.id)).toBe('160.00');

      const res = await p.agente.patch(`/api/v1/movimientos/${mov.id}`).send({ cuentaId: efectivo.id });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ cuentaId: efectivo.id, moneda: 'PEN' });
      expect(await saldo(p.agente, ahorros.id)).toBe('200.00');
      expect(await saldo(p.agente, efectivo.id)).toBe('60.00');
      expect((await verificarSaldos()).diferencias.filter((d) => [ahorros.id, efectivo.id].includes(d.id))).toEqual([]);
    });

    it('Categoría incompatible con el tipo: 400 con el mensaje de cada tipo y sin tocar el saldo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const ingreso = await registrar(p.agente, ingresoDe(p, cuenta, '10', { categoriaId: p.gasto.id }));
      expect(ingreso.status).toBe(400);
      expect(ingreso.body.error.details).toEqual([{ campo: 'categoriaId', mensaje: 'Selecciona una categoría de ingreso' }]);
      const gasto = await registrar(p.agente, gastoDe(p, cuenta, '10', { categoriaId: p.ingreso.id }));
      expect(gasto.body.error.details).toEqual([{ campo: 'categoriaId', mensaje: 'Selecciona una categoría de gasto' }]);
      expect(await saldo(p.agente, cuenta.id)).toBe('500.00');

      // Al editar el tipo sin cambiar la categoría ocurre lo mismo.
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '10'))).body.data;
      const edicion = await p.agente.patch(`/api/v1/movimientos/${mov.id}`).send({ tipo: 'ingreso' });
      expect(edicion.status).toBe(400);
      expect(await saldo(p.agente, cuenta.id)).toBe('490.00');
    });

    it('Cuentas y categorías ajenas o inexistentes se rechazan sin revelar nada ni tocar los saldos ajenos', async () => {
      const a = await preparar();
      const b = await preparar();
      const cuentaA = await a.cuenta();
      const cuentaB = await b.cuenta('De B');
      const ajena = await registrar(a.agente, gastoDe(a, cuentaB, '10'));
      expect(ajena.status).toBe(400);
      expect(ajena.body.error.details).toEqual([{ campo: 'cuentaId', mensaje: 'La cuenta seleccionada no existe' }]);
      const categoriaAjena = await registrar(a.agente, gastoDe(a, cuentaA, '10', { categoriaId: b.gasto.id }));
      expect(categoriaAjena.body.error.details).toEqual([
        { campo: 'categoriaId', mensaje: 'La categoría seleccionada no existe' },
      ]);
      const inexistente = await registrar(a.agente, gastoDe(a, cuentaA, '10', { cuentaId: '65f000000000000000000000' }));
      expect(inexistente.body.error.details[0].mensaje).toBe('La cuenta seleccionada no existe');
      expect((await registrar(a.agente, gastoDe(a, cuentaA, '10', { cuentaId: 'x' }))).status).toBe(400);

      expect(await saldo(b.agente, cuentaB.id)).toBe('500.00');
      expect((await listar(b.agente)).data).toEqual([]);
    });

    it('Fecha futura rechazada con el mensaje exacto; la de hoy se acepta', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const futura = await registrar(p.agente, gastoDe(p, cuenta, '10', { fecha: '2026-01-16' }));
      expect(futura.status).toBe(400);
      expect(futura.body.error.details).toEqual([{ campo: 'fecha', mensaje: 'La fecha no puede ser futura' }]);
      expect((await registrar(p.agente, gastoDe(p, cuenta, '10', { fecha: HOY }))).status).toBe(201);
      expect(await saldo(p.agente, cuenta.id)).toBe('490.00');
    });
  });

  describe('Reglas de cuentas y categorías con movimientos reales', () => {
    it('Eliminación impedida por movimientos asociados: 409 con el mensaje exacto y se conservan', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const mov = (await registrar(p.agente, gastoDe(p, cuenta, '10'))).body.data;

      const cuentaRes = await p.agente.delete(`/api/v1/cuentas/${cuenta.id}`);
      expect(cuentaRes.status).toBe(409);
      expect(cuentaRes.body.error.message).toBe('No se puede eliminar una cuenta con movimientos asociados');
      const categoriaRes = await p.agente.delete(`/api/v1/categorias/${p.gasto.id}`);
      expect(categoriaRes.status).toBe(409);
      expect(categoriaRes.body.error.message).toBe(
        'No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero',
      );

      // Al eliminar el movimiento ya se pueden eliminar.
      await p.agente.delete(`/api/v1/movimientos/${mov.id}`);
      expect((await p.agente.delete(`/api/v1/cuentas/${cuenta.id}`)).status).toBe(204);
      expect((await p.agente.delete(`/api/v1/categorias/${p.gasto.id}`)).status).toBe(204);
    });

    it('Cambio de moneda impedido en una cuenta con movimientos', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Dólares', 'USD');
      await registrar(p.agente, gastoDe(p, cuenta, '10'));
      const res = await p.agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ moneda: 'PEN' });
      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('No se puede cambiar la moneda de una cuenta con movimientos asociados');
    });

    it('Corregir el saldo inicial con movimientos reales mantiene la fórmula', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta('Corrección', 'PEN', '100.00');
      await registrar(p.agente, gastoDe(p, cuenta, '30.00'));
      const res = await p.agente.patch(`/api/v1/cuentas/${cuenta.id}`).send({ saldoInicial: '120.00' });
      expect(res.body.data).toMatchObject({ saldoInicial: '120.00', saldoActual: '90.00' });
      expect((await verificarSaldos()).diferencias.filter((d) => d.id === cuenta.id)).toEqual([]);
    });
  });
});

describe('HU-04 · HU-05 · HU-22 · lectura de movimientos por administración', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const usuarios = () => mongoose.connection.collection('usuarios');
  async function sesion(rol = ROLES.USUARIO) {
    const u = await e.registrar();
    if (rol !== ROLES.USUARIO) await usuarios().updateOne({ _id: new mongoose.Types.ObjectId(u.id) }, { $set: { rol } });
    const { agente } = await e.iniciarSesion(u);
    return { u, agente };
  }
  const deUsuario = (agente, usuarioId, consulta = '?limit=100') =>
    agente.get(`/api/v1/admin/usuarios/${usuarioId}/movimientos${consulta}`);

  /** Crea una cuenta y un gasto para la persona indicada. */
  async function conMovimiento({ agente }, monto = '25.00') {
    const categorias = (await agente.get('/api/v1/categorias?limit=100')).body.data;
    const cuenta = (await agente.post('/api/v1/cuentas').send({ nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '100' }))
      .body.data;
    const res = await agente.post('/api/v1/movimientos').send({
      tipo: 'gasto',
      monto,
      fecha: HOY,
      categoriaId: categorias.find((c) => c.tipo === 'gasto').id,
      cuentaId: cuenta.id,
    });
    return { cuenta, movimiento: res.body.data };
  }

  it('HU-04 · el administrador consulta los movimientos de cualquier usuario', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const luis = await sesion();
    const deAna = await conMovimiento(ana, '25.00');
    await conMovimiento(luis, '80.00');

    const res = await deUsuario(admin.agente, ana.u.id);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id: deAna.movimiento.id, monto: '25.00', moneda: 'PEN', fecha: HOY });
    expect(res.body.meta).toMatchObject({ total: 1, page: 1 });
    expect((await deUsuario(admin.agente, luis.u.id)).body.data[0].monto).toBe('80.00');
    expect((await deUsuario(admin.agente, luis.u.id, '?tipo=ingreso')).body.data).toEqual([]);
  });

  it('HU-04 · un usuario estándar recibe 403 en la lectura de administración', async () => {
    const ana = await sesion();
    const luis = await sesion();
    for (const usuarioId of [ana.u.id, luis.u.id]) {
      const res = await deUsuario(ana.agente, usuarioId);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({ code: 'FORBIDDEN', message: 'Acceso no autorizado' });
    }
  });

  it('HU-22 · un usuario inexistente o inválido responde 404 y uno sin movimientos devuelve la lista vacía', async () => {
    const admin = await sesion(ROLES.ADMIN);
    expect((await deUsuario(admin.agente, '65f000000000000000000000')).status).toBe(404);
    expect((await deUsuario(admin.agente, 'no-es-un-id')).status).toBe(404);
    const vacio = await sesion();
    const res = await deUsuario(admin.agente, vacio.u.id);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('HU-22 · el administrador no puede modificar movimientos ajenos: PATCH, DELETE y POST responden 404 y nada cambia', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const { cuenta, movimiento } = await conMovimiento(ana);
    const antes = (await deUsuario(admin.agente, ana.u.id)).body.data;

    const editar = await admin.agente.patch(`/api/v1/movimientos/${movimiento.id}`).send({ monto: '1' });
    const borrar = await admin.agente.delete(`/api/v1/movimientos/${movimiento.id}`);
    const crear = await admin.agente.post(`/api/v1/admin/usuarios/${ana.u.id}/movimientos`).send({});
    expect([editar.status, borrar.status, crear.status]).toEqual([404, 404, 404]);
    expect(editar.body.error.message).toBe(NO_EXISTE);
    expect((await deUsuario(admin.agente, ana.u.id)).body.data).toEqual(antes);
    expect((await ana.agente.get(`/api/v1/cuentas/${cuenta.id}`)).body.data.saldoActual).toBe('75.00');
  });

  it('HU-05 · un usuario no ve ni modifica los movimientos de otro conociendo su id', async () => {
    const ana = await sesion();
    const luis = await sesion();
    const { movimiento } = await conMovimiento(ana);
    expect((await luis.agente.get('/api/v1/movimientos?limit=100')).body.data).toEqual([]);
    expect((await luis.agente.patch(`/api/v1/movimientos/${movimiento.id}`).send({ monto: '1' })).status).toBe(404);
    expect((await luis.agente.delete(`/api/v1/movimientos/${movimiento.id}`)).status).toBe(404);
  });
});
