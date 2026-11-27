// HU-12 · indicadores, HU-13 · gráficos y HU-28 · dashboard por moneda, sobre la API. El reloj marca el 2026-01-15.
import request from 'supertest';
import { iniciarEntorno } from './helpers/api.js';

describe('dashboard', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  async function preparar() {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const categorias = (await agente.get('/api/v1/categorias?limit=100')).body.data;
    const cuenta = async (moneda = 'PEN') =>
      (await agente.post('/api/v1/cuentas').send({ nombre: `Cuenta ${moneda}`, tipo: 'banco', moneda, saldoInicial: '10000' }))
        .body.data;
    return {
      agente,
      cuenta,
      gasto: (nombre) => categorias.find((c) => c.tipo === 'gasto' && c.nombre === nombre),
      sueldo: categorias.find((c) => c.tipo === 'ingreso'),
    };
  }
  const mover = (agente, cuentaId, tipo, categoriaId, monto, fecha) =>
    agente.post('/api/v1/movimientos').send({ tipo, monto, fecha, categoriaId, cuentaId });
  const indicadores = (agente, consulta = '') => agente.get(`/api/v1/dashboard/indicadores${consulta}`);
  const graficos = (agente, consulta = '') => agente.get(`/api/v1/dashboard/graficos${consulta}`);

  describe('HU-12 · indicadores', () => {
    it('Indicadores del mes en curso: ingresos, gastos, balance y porcentaje de presupuesto', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'ingreso', p.sueldo.id, '3000', '2026-01-05');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Alimentación').id, '600.50', '2026-01-08');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Transporte').id, '299.50', '2026-01-09');
      await p.agente.post('/api/v1/presupuestos').send({ periodo: '2026-01', moneda: 'PEN', monto: '1500' });

      const res = await indicadores(p.agente);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        periodo: '2026-01',
        moneda: 'PEN',
        ingresos: '3000.00',
        gastos: '900.00',
        balance: '2100.00',
        hayMovimientos: true,
        presupuesto: { monto: '1500.00', gastado: '900.00', porcentaje: 60, restante: '600.00', excedido: false },
      });
    });

    it('Cambio de período: recalcula con los movimientos del mes elegido', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'ingreso', p.sueldo.id, '1000', '2025-12-10');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Salud').id, '250', '2025-12-20');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Salud').id, '40', '2026-01-02');
      const anterior = await indicadores(p.agente, '?periodo=2025-12');
      expect(anterior.body.data).toMatchObject({ periodo: '2025-12', ingresos: '1000.00', gastos: '250.00', balance: '750.00' });
      const actual = await indicadores(p.agente);
      expect(actual.body.data).toMatchObject({ ingresos: '0.00', gastos: '40.00', balance: '-40.00' });
    });

    it('Sin movimientos: todo en cero, sin presupuesto y con hayMovimientos en falso', async () => {
      const { agente } = await preparar();
      const res = await indicadores(agente);
      expect(res.body.data).toMatchObject({
        ingresos: '0.00',
        gastos: '0.00',
        balance: '0.00',
        hayMovimientos: false,
        presupuesto: null,
      });
    });

    it('Presupuesto excedido: porcentaje por encima de 100 y monto sobregirado', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await p.agente.post('/api/v1/presupuestos').send({ periodo: '2026-01', moneda: 'PEN', monto: '1000' });
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Alimentación').id, '1150', '2026-01-08');
      const { presupuesto } = (await indicadores(p.agente)).body.data;
      expect(presupuesto).toMatchObject({ porcentaje: 115, excedido: true, sobregiro: '150.00', restante: '0.00' });
    });

    it('Período o moneda inválidos: 400 con el mensaje del campo', async () => {
      const { agente } = await preparar();
      const periodo = await indicadores(agente, '?periodo=2026-13');
      expect(periodo.status).toBe(400);
      expect(periodo.body.error.details[0]).toMatchObject({ campo: 'periodo' });
      expect((await indicadores(agente, '?moneda=XXX')).status).toBe(400);
    });

    it('Sin sesión responde 401 y los datos de otra persona nunca se mezclan', async () => {
      const a = await preparar();
      const b = await preparar();
      const cuenta = await a.cuenta();
      await mover(a.agente, cuenta.id, 'gasto', a.gasto('Salud').id, '80', '2026-01-02');
      expect((await indicadores(b.agente)).body.data.gastos).toBe('0.00');
      expect((await request(e.app).get('/api/v1/dashboard/indicadores')).status).toBe(401);
    });
  });

  describe('HU-28 · dashboard por moneda', () => {
    it('Por defecto usa la moneda principal y solo cuenta los movimientos de esa moneda', async () => {
      const p = await preparar();
      const pen = await p.cuenta('PEN');
      const usd = await p.cuenta('USD');
      await mover(p.agente, pen.id, 'gasto', p.gasto('Salud').id, '100', '2026-01-02');
      await mover(p.agente, usd.id, 'gasto', p.gasto('Salud').id, '30', '2026-01-03');
      expect((await indicadores(p.agente)).body.data).toMatchObject({ moneda: 'PEN', gastos: '100.00' });
      expect((await indicadores(p.agente, '?moneda=USD')).body.data).toMatchObject({ moneda: 'USD', gastos: '30.00' });
    });

    it('Selector limitado a las monedas en uso; sin cuentas muestra la moneda principal', async () => {
      const p = await preparar();
      expect((await p.agente.get('/api/v1/dashboard/monedas')).body.data).toEqual({ principal: 'PEN', monedas: ['PEN'] });
      await p.cuenta('PEN');
      expect((await p.agente.get('/api/v1/dashboard/monedas')).body.data.monedas).toEqual(['PEN']);
      await p.cuenta('USD');
      expect((await p.agente.get('/api/v1/dashboard/monedas')).body.data.monedas).toEqual(['PEN', 'USD']);
    });

    it('Los gráficos también usan solo la moneda elegida', async () => {
      const p = await preparar();
      const pen = await p.cuenta('PEN');
      const usd = await p.cuenta('USD');
      await mover(p.agente, pen.id, 'gasto', p.gasto('Salud').id, '100', '2026-01-02');
      await mover(p.agente, usd.id, 'gasto', p.gasto('Transporte').id, '30', '2026-01-03');
      const pesos = (await graficos(p.agente)).body.data;
      expect(pesos.distribucion.items.map((i) => i.nombre)).toEqual(['Salud']);
      const dolares = (await graficos(p.agente, '?moneda=USD')).body.data;
      expect(dolares.distribucion.items.map((i) => i.nombre)).toEqual(['Transporte']);
    });
  });

  describe('HU-05 · privacidad con categorías de igual nombre', () => {
    it('Usuarios con categorías de igual nombre: los totales y la distribución de A no incluyen los gastos de B', async () => {
      const a = await preparar();
      const b = await preparar();
      const cuentaA = await a.cuenta();
      const cuentaB = await b.cuenta();
      expect(a.gasto('Alimentación').nombre).toBe(b.gasto('Alimentación').nombre);
      await mover(a.agente, cuentaA.id, 'gasto', a.gasto('Alimentación').id, '100', '2026-01-05');
      await mover(b.agente, cuentaB.id, 'gasto', b.gasto('Alimentación').id, '70', '2026-01-05');

      expect((await indicadores(a.agente)).body.data.gastos).toBe('100.00');
      const { distribucion } = (await graficos(a.agente)).body.data;
      expect(distribucion.items).toEqual([expect.objectContaining({ nombre: 'Alimentación', total: '100.00' })]);
      const historial = (await a.agente.get(`/api/v1/movimientos?categoriaId=${a.gasto('Alimentación').id}`)).body;
      expect(historial.meta.total).toBe(1);
      expect(historial.data[0].monto).toBe('100.00');
    });
  });

  describe('HU-13 · gráficos', () => {
    it('Evolución de 6 meses con ceros en los meses sin movimientos y distribución con monto y porcentaje', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'ingreso', p.sueldo.id, '2000', '2025-08-10');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Alimentación').id, '500', '2025-10-10');
      await mover(p.agente, cuenta.id, 'ingreso', p.sueldo.id, '2500', '2026-01-05');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Alimentación').id, '300', '2026-01-06');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Transporte').id, '100', '2026-01-07');

      const { evolucion, distribucion } = (await graficos(p.agente)).body.data;
      expect(evolucion.map((m) => m.periodo)).toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01']);
      expect(evolucion[0]).toEqual({ periodo: '2025-08', ingresos: '2000.00', gastos: '0.00' });
      expect(evolucion[1]).toEqual({ periodo: '2025-09', ingresos: '0.00', gastos: '0.00' });
      expect(evolucion[2]).toEqual({ periodo: '2025-10', ingresos: '0.00', gastos: '500.00' });
      expect(evolucion[5]).toEqual({ periodo: '2026-01', ingresos: '2500.00', gastos: '400.00' });
      expect(distribucion.total).toBe('400.00');
      expect(distribucion.items).toEqual([
        expect.objectContaining({ nombre: 'Alimentación', total: '300.00', porcentaje: 75 }),
        expect.objectContaining({ nombre: 'Transporte', total: '100.00', porcentaje: 25 }),
      ]);
    });

    it('Solo ingresos: la distribución viene vacía y la evolución se muestra', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'ingreso', p.sueldo.id, '900', '2026-01-05');
      const { evolucion, distribucion } = (await graficos(p.agente)).body.data;
      expect(distribucion).toEqual({ total: '0.00', items: [] });
      expect(evolucion.at(-1)).toMatchObject({ ingresos: '900.00', gastos: '0.00' });
    });

    it('Más de ocho categorías: las ocho mayores y el resto agrupado en "Otras"', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      const nombres = ['Alimentación', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Hogar', 'Servicios', 'Ropa'];
      let monto = 100;
      const usados = [];
      for (const nombre of nombres) {
        const categoria = p.gasto(nombre);
        if (categoria) usados.push(categoria);
      }
      for (const nombre of ['Extra 1', 'Extra 2', 'Extra 3', 'Extra 4', 'Extra 5']) {
        const creada = (await p.agente.post('/api/v1/categorias').send({ nombre, tipo: 'gasto', icono: 'circle-ellipsis' })).body.data;
        usados.push(creada);
      }
      for (const categoria of usados) {
        await mover(p.agente, cuenta.id, 'gasto', categoria.id, String(monto), '2026-01-05');
        monto += 10;
      }
      const { distribucion } = (await graficos(p.agente)).body.data;
      expect(distribucion.items).toHaveLength(9);
      expect(distribucion.items.at(-1)).toMatchObject({ nombre: 'Otras', categoriaId: null });
      const suma = distribucion.items.reduce((total, i) => total + Number(i.total), 0);
      expect(suma).toBeCloseTo(Number(distribucion.total), 2);
    });

    it('Sin sesión responde 401', async () => {
      const respuesta = await request(e.app).get('/api/v1/dashboard/graficos');
      expect(respuesta.status).toBe(401);
    });
  });
});
