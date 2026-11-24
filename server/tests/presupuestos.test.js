// HU-14 · definir presupuesto, HU-15 · seguimiento y alertas, HU-29 · moneda y período, HU-30 · categorías dentro del
// general, y la lectura de administrador (HU-04, HU-05, HU-22). El reloj de pruebas marca el 2026-01-15.
import { ROLES } from '@finanzas/shared';
import mongoose from 'mongoose';
import { iniciarEntorno } from './helpers/api.js';

const NO_EXISTE = 'El recurso solicitado no existe o no tienes permiso para acceder a él';
const MONTO_INVALIDO = 'El presupuesto debe ser un monto mayor a 0';
const MES_PASADO = 'Solo puedes definir presupuestos para el mes actual o meses futuros';
const SUMA_SUPERA = 'La suma por categorías supera el presupuesto general';
const GENERAL_MENOR = 'El presupuesto general no puede ser menor a lo asignado por categorías';
const MES = '2026-01';

describe('presupuestos', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  async function preparar() {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const categorias = (await agente.get('/api/v1/categorias?limit=100')).body.data;
    const cuenta = async (moneda = 'PEN', nombre = `Cuenta ${moneda}`) =>
      (await agente.post('/api/v1/cuentas').send({ nombre, tipo: 'banco', moneda, saldoInicial: '5000' })).body.data;
    return {
      u,
      agente,
      cuenta,
      gasto: (nombre) => categorias.find((c) => c.tipo === 'gasto' && c.nombre === nombre),
      ingreso: categorias.find((c) => c.tipo === 'ingreso'),
    };
  }
  const crear = (agente, datos) => agente.post('/api/v1/presupuestos').send({ periodo: MES, moneda: 'PEN', ...datos });
  const gastar = (agente, cuentaId, categoriaId, monto, fecha = '2026-01-10') =>
    agente.post('/api/v1/movimientos').send({ tipo: 'gasto', monto, fecha, categoriaId, cuentaId });
  const seguimiento = async (agente, consulta = `periodo=${MES}`) =>
    (await agente.get(`/api/v1/presupuestos/seguimiento?${consulta}`)).body;

  describe('HU-14 · definir presupuesto mensual', () => {
    it('Definición exitosa: queda ligado a su tenantId y usuarioId y disponible para el seguimiento', async () => {
      const { u, agente } = await preparar();
      const res = await crear(agente, { monto: '1500' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ periodo: MES, moneda: 'PEN', categoriaId: null, monto: '1500.00' });

      const usuario = await mongoose.connection.collection('usuarios').findOne({ email: u.email });
      const guardado = await mongoose.connection
        .collection('presupuestos')
        .findOne({ _id: new mongoose.Types.ObjectId(res.body.data.id) });
      expect(guardado.tenantId).toBe(usuario.tenantId);
      expect(String(guardado.usuarioId)).toBe(String(usuario._id));
      expect(guardado.monto).toBeInstanceOf(mongoose.Types.Decimal128);

      const { data } = await seguimiento(agente);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({ monto: '1500.00', gastado: '0.00', restante: '1500.00', porcentaje: 0 });
    });

    it('Asignación por categoría: se registra junto al general', async () => {
      const p = await preparar();
      await crear(p.agente, { monto: '1500' });
      const res = await crear(p.agente, { monto: '300', categoriaId: p.gasto('Entretenimiento').id });
      expect(res.status).toBe(201);
      expect(res.body.data.categoriaId).toBe(p.gasto('Entretenimiento').id);
    });

    it.each([['-5'], [''], ['0'], ['abc']])('Monto inválido (%j): se rechaza con el mensaje de la spec', async (monto) => {
      const { agente } = await preparar();
      const res = await crear(agente, { monto });
      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([expect.objectContaining({ campo: 'monto', mensaje: MONTO_INVALIDO })]);
    });

    it('Reemplazar un presupuesto existente: la creación repetida da 409 y PUT cambia el monto', async () => {
      const { agente } = await preparar();
      const primero = await crear(agente, { monto: '1500' });
      const repetido = await crear(agente, { monto: '2000' });
      expect(repetido.status).toBe(409);

      const reemplazo = await agente.put(`/api/v1/presupuestos/${primero.body.data.id}`).send({ monto: '2000' });
      expect(reemplazo.status).toBe(200);
      expect(reemplazo.body.data.monto).toBe('2000.00');
      expect((await agente.get('/api/v1/presupuestos')).body.data).toHaveLength(1);
    });

    it('Un presupuesto ajeno responde 404 y no se modifica ni se elimina', async () => {
      const a = await preparar();
      const b = await preparar();
      const ajeno = (await crear(a.agente, { monto: '1500' })).body.data;
      expect((await b.agente.put(`/api/v1/presupuestos/${ajeno.id}`).send({ monto: '1' })).status).toBe(404);
      const borrado = await b.agente.delete(`/api/v1/presupuestos/${ajeno.id}`);
      expect(borrado.status).toBe(404);
      expect(borrado.body.error.message).toBe(NO_EXISTE);
      expect((await b.agente.get('/api/v1/presupuestos')).body.data).toEqual([]);
      expect((await a.agente.get('/api/v1/presupuestos')).body.data).toHaveLength(1);
    });
  });

  describe('HU-29 · moneda y período', () => {
    it('Presupuestos independientes por moneda: un gasto en USD solo mueve el avance en USD', async () => {
      const p = await preparar();
      const usd = await p.cuenta('USD');
      await crear(p.agente, { monto: '1500' });
      await crear(p.agente, { monto: '200', moneda: 'USD' });
      await gastar(p.agente, usd.id, p.gasto('Alimentación').id, '50');
      const { data } = await seguimiento(p.agente);
      expect(data.find((x) => x.moneda === 'USD')).toMatchObject({ porcentaje: 25, gastado: '50.00' });
      expect(data.find((x) => x.moneda === 'PEN')).toMatchObject({ porcentaje: 0, gastado: '0.00' });
    });

    it('Gastos en otra moneda no cuentan para el presupuesto en PEN', async () => {
      const p = await preparar();
      const usd = await p.cuenta('USD');
      await crear(p.agente, { monto: '1500' });
      await gastar(p.agente, usd.id, p.gasto('Alimentación').id, '300');
      const { data } = await seguimiento(p.agente);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({ moneda: 'PEN', porcentaje: 0, gastado: '0.00' });
    });

    it('Mes pasado rechazado con su mensaje; el futuro se acepta y el pasado ya definido se consulta', async () => {
      const { agente } = await preparar();
      const pasado = await crear(agente, { periodo: '2025-12', monto: '100' });
      expect(pasado.status).toBe(400);
      expect(pasado.body.error.details).toEqual([expect.objectContaining({ campo: 'periodo', mensaje: MES_PASADO })]);
      expect((await crear(agente, { periodo: '2026-03', monto: '100' })).status).toBe(201);
      const futuro = await agente.get('/api/v1/presupuestos?periodo=2026-03');
      expect(futuro.body.data).toHaveLength(1);
    });

    it('Presupuesto en una moneda sin gastos: 0 % utilizado y el monto completo disponible', async () => {
      const { agente } = await preparar();
      await crear(agente, { monto: '400', moneda: 'EUR' });
      const { data } = await seguimiento(agente, `periodo=${MES}&moneda=EUR`);
      expect(data[0]).toMatchObject({ moneda: 'EUR', porcentaje: 0, restante: '400.00', excedido: false });
    });
  });

  describe('HU-30 · categorías dentro del general', () => {
    async function conGeneral(monto = '1500') {
      const p = await preparar();
      await crear(p.agente, { monto });
      return p;
    }

    it('Categoría dentro del general: se guarda y el general muestra lo que queda sin asignar', async () => {
      const p = await conGeneral();
      await crear(p.agente, { monto: '700', categoriaId: p.gasto('Alimentación').id });
      await crear(p.agente, { monto: '300', categoriaId: p.gasto('Transporte').id });
      expect((await crear(p.agente, { monto: '300', categoriaId: p.gasto('Entretenimiento').id })).status).toBe(201);
      const general = (await seguimiento(p.agente)).data.find((x) => x.categoriaId === null);
      expect(general.sinAsignar).toBe('200.00');
    });

    it('Gasto sin presupuesto de categoría: cuenta para el general', async () => {
      const p = await conGeneral('1000');
      const cuenta = await p.cuenta();
      await crear(p.agente, { monto: '300', categoriaId: p.gasto('Alimentación').id });
      await gastar(p.agente, cuenta.id, p.gasto('Salud').id, '100');
      const { data } = await seguimiento(p.agente);
      expect(data.find((x) => x.categoriaId === null)).toMatchObject({ gastado: '100.00', porcentaje: 10 });
      expect(data.find((x) => x.categoriaId !== null)).toMatchObject({ gastado: '0.00' });
    });

    it('Cada presupuesto tiene su propio seguimiento y un gasto de categoría cuenta en ambos', async () => {
      const p = await conGeneral('1000');
      const cuenta = await p.cuenta();
      await crear(p.agente, { monto: '200', categoriaId: p.gasto('Alimentación').id });
      await gastar(p.agente, cuenta.id, p.gasto('Alimentación').id, '50');
      const { data } = await seguimiento(p.agente);
      expect(data.find((x) => x.categoriaId === null)).toMatchObject({ gastado: '50.00', porcentaje: 5 });
      expect(data.find((x) => x.categoriaId !== null)).toMatchObject({ gastado: '50.00', porcentaje: 25 });
    });

    it('Sin general: no se puede crear uno por categoría', async () => {
      const p = await preparar();
      const res = await crear(p.agente, { monto: '100', categoriaId: p.gasto('Alimentación').id });
      expect(res.status).toBe(400);
      expect(res.body.error.details[0]).toMatchObject({ campo: 'categoriaId' });
    });

    it('Suma superior al general: se rechaza con el mensaje de la spec', async () => {
      const p = await conGeneral();
      await crear(p.agente, { monto: '1300', categoriaId: p.gasto('Alimentación').id });
      const res = await crear(p.agente, { monto: '300', categoriaId: p.gasto('Transporte').id });
      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([expect.objectContaining({ campo: 'monto', mensaje: SUMA_SUPERA })]);
    });

    it('Reducción del general por debajo de lo asignado: se rechaza con el mensaje de la spec', async () => {
      const p = await preparar();
      const general = (await crear(p.agente, { monto: '1500' })).body.data;
      await crear(p.agente, { monto: '1300', categoriaId: p.gasto('Alimentación').id });
      const res = await p.agente.put(`/api/v1/presupuestos/${general.id}`).send({ monto: '1000' });
      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([expect.objectContaining({ campo: 'monto', mensaje: GENERAL_MENOR })]);
      expect((await p.agente.put(`/api/v1/presupuestos/${general.id}`).send({ monto: '1300' })).status).toBe(200);
    });

    it('Un general con categorías no se elimina; una categoría con presupuesto tampoco', async () => {
      const p = await preparar();
      const general = (await crear(p.agente, { monto: '1500' })).body.data;
      const alimentacion = p.gasto('Alimentación');
      const porCategoria = (await crear(p.agente, { monto: '300', categoriaId: alimentacion.id })).body.data;
      expect((await p.agente.delete(`/api/v1/presupuestos/${general.id}`)).status).toBe(409);
      expect((await p.agente.delete(`/api/v1/categorias/${alimentacion.id}`)).status).toBe(409);
      expect((await p.agente.delete(`/api/v1/presupuestos/${porCategoria.id}`)).status).toBe(204);
      expect((await p.agente.delete(`/api/v1/presupuestos/${general.id}`)).status).toBe(204);
    });

    it('La categoría debe ser propia y de gasto', async () => {
      const p = await conGeneral();
      const otra = await preparar();
      const deIngreso = await crear(p.agente, { monto: '10', categoriaId: p.ingreso.id });
      expect(deIngreso.status).toBe(400);
      const ajena = await crear(p.agente, { monto: '10', categoriaId: otra.gasto('Alimentación').id });
      expect(ajena.status).toBe(400);
    });
  });

  describe('HU-15 · seguimiento y alertas', () => {
    it('Avance del 60 %: porcentaje y monto restante', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await crear(p.agente, { monto: '1500' });
      await gastar(p.agente, cuenta.id, p.gasto('Alimentación').id, '900');
      const { data } = await seguimiento(p.agente);
      expect(data[0]).toMatchObject({ porcentaje: 60, restante: '600.00', gastado: '900.00', excedido: false });
    });

    it('Alerta al cruzar el 90 %: la respuesta del gasto lleva meta.alertas una sola vez', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const presupuesto = (await crear(p.agente, { monto: '1000' })).body.data;
      const alimentacion = p.gasto('Alimentación').id;
      expect((await gastar(p.agente, cuenta.id, alimentacion, '800')).body.meta).toBeUndefined();
      const cruce = await gastar(p.agente, cuenta.id, alimentacion, '100');
      expect(cruce.body.meta.alertas).toEqual([
        { presupuestoId: presupuesto.id, umbral: 90, porcentaje: 90, categoriaId: null },
      ]);
      const sigue = await gastar(p.agente, cuenta.id, alimentacion, '10');
      expect(sigue.body.meta?.alertas).toBeUndefined();
    });

    it('Excedido: alerta de 100 al pasarse, porcentaje excedido y monto sobregirado', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await crear(p.agente, { monto: '1000' });
      await gastar(p.agente, cuenta.id, p.gasto('Alimentación').id, '950');
      const res = await gastar(p.agente, cuenta.id, p.gasto('Alimentación').id, '200');
      expect(res.body.meta.alertas).toEqual([expect.objectContaining({ umbral: 100, porcentaje: 115 })]);
      const { data } = await seguimiento(p.agente);
      expect(data[0]).toMatchObject({ porcentaje: 115, excedido: true, sobregiro: '150.00', restante: '0.00' });
    });

    it('Un gasto de categoría avisa por su presupuesto de categoría y por el general', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await crear(p.agente, { monto: '1000' });
      const porCategoria = (await crear(p.agente, { monto: '100', categoriaId: p.gasto('Alimentación').id })).body.data;
      const res = await gastar(p.agente, cuenta.id, p.gasto('Alimentación').id, '95');
      expect(res.body.meta.alertas).toEqual([
        expect.objectContaining({ presupuestoId: porCategoria.id, umbral: 90, categoriaId: p.gasto('Alimentación').id }),
      ]);
    });

    it('Editar un gasto que cruza el umbral también avisa; un ingreso o un gasto de otra moneda no', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const usd = await p.cuenta('USD');
      await crear(p.agente, { monto: '1000' });
      const gasto = (await gastar(p.agente, cuenta.id, p.gasto('Alimentación').id, '100')).body.data;
      const editado = await p.agente.patch(`/api/v1/movimientos/${gasto.id}`).send({ monto: '950' });
      expect(editado.body.meta.alertas).toEqual([expect.objectContaining({ umbral: 90 })]);
      expect((await gastar(p.agente, usd.id, p.gasto('Alimentación').id, '5000')).body.meta?.alertas).toBeUndefined();
      const ingreso = await p.agente
        .post('/api/v1/movimientos')
        .send({ tipo: 'ingreso', monto: '500', fecha: '2026-01-10', categoriaId: p.ingreso.id, cuentaId: cuenta.id });
      expect(ingreso.body.meta?.alertas).toBeUndefined();
    });

    it('Sin presupuesto definido: el seguimiento viene vacío', async () => {
      const { agente } = await preparar();
      const res = await seguimiento(agente);
      expect(res.data).toEqual([]);
      expect(res.meta).toMatchObject({ periodo: MES });
    });
  });

  describe('lectura de administrador (HU-04, HU-05, HU-22)', () => {
    it('El administrador lista los presupuestos de otra persona y no tiene rutas de escritura', async () => {
      const p = await preparar();
      await crear(p.agente, { monto: '1500' });
      const admin = await e.registrar();
      await mongoose.connection
        .collection('usuarios')
        .updateOne({ _id: new mongoose.Types.ObjectId(admin.id) }, { $set: { rol: ROLES.ADMIN } });
      const { agente: agenteAdmin } = await e.iniciarSesion(admin);
      const usuario = await mongoose.connection.collection('usuarios').findOne({ email: p.u.email });
      const lectura = await agenteAdmin.get(`/api/v1/admin/usuarios/${usuario._id}/presupuestos`);
      expect(lectura.status).toBe(200);
      expect(lectura.body.data).toHaveLength(1);
      expect(lectura.body.data[0].monto).toBe('1500.00');
      const escritura = await agenteAdmin.post(`/api/v1/admin/usuarios/${usuario._id}/presupuestos`).send({});
      expect(escritura.status).toBe(404);
    });

    it('Una persona estándar no accede a la ruta de administración', async () => {
      const p = await preparar();
      const usuario = await mongoose.connection.collection('usuarios').findOne({ email: p.u.email });
      expect((await p.agente.get(`/api/v1/admin/usuarios/${usuario._id}/presupuestos`)).status).toBe(403);
    });
  });
});
