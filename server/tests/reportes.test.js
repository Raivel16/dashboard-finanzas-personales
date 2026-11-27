// HU-16 · PDF, HU-17 · Excel y HU-31 · reportes por moneda, sobre la API. El reloj marca el 2026-01-15.
import mongoose from 'mongoose';
import request from 'supertest';
import * as XLSX from 'xlsx';
import { iniciarEntorno } from './helpers/api.js';
import { Movimiento } from '../src/models/movimiento.model.js';

const binario = (res, cb) => {
  const trozos = [];
  res.on('data', (t) => trozos.push(t));
  res.on('end', () => cb(null, Buffer.concat(trozos)));
};

describe('reportes', () => {
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
      (
        await agente
          .post('/api/v1/cuentas')
          .send({ nombre: `Cuenta ${moneda}`, tipo: 'banco', moneda, saldoInicial: '10000' })
      ).body.data;
    return {
      agente,
      cuenta,
      gasto: (nombre) => categorias.find((c) => c.tipo === 'gasto' && c.nombre === nombre),
      sueldo: categorias.find((c) => c.tipo === 'ingreso'),
    };
  }
  const mover = (agente, cuentaId, tipo, categoriaId, monto, fecha, descripcion) =>
    agente.post('/api/v1/movimientos').send({ tipo, monto, fecha, categoriaId, cuentaId, descripcion });
  const excel = (agente, consulta = '') =>
    agente.get(`/api/v1/reportes/movimientos.xlsx${consulta}`).buffer(true).parse(binario);
  const pdf = (agente, consulta = '') =>
    agente.get(`/api/v1/reportes/movimientos.pdf${consulta}`).buffer(true).parse(binario);
  const hoja = (res, nombre) => XLSX.utils.sheet_to_json(XLSX.read(res.body).Sheets[nombre], { header: 1 });

  describe('HU-17 · Excel', () => {
    it('Exportación exitosa: descarga .xlsx con fecha, tipo, categoría, cuenta, moneda, monto y descripción', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(
        p.agente,
        cuenta.id,
        'gasto',
        p.gasto('Alimentación').id,
        '120.50',
        '2026-01-08',
        'Mercado',
      );
      const res = await excel(p.agente);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toBe('attachment; filename="movimientos-2026-01.xlsx"');
      const filas = hoja(res, 'Movimientos');
      expect(filas[0]).toEqual(['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Moneda', 'Monto', 'Descripción']);
      expect(filas[1]).toEqual([
        '2026-01-08',
        'Gasto',
        'Alimentación',
        'Cuenta PEN',
        'PEN',
        120.5,
        'Mercado',
      ]);
    });

    it('Hoja "Resumen" con los totales por categoría y tipo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'ingreso', p.sueldo.id, '3000', '2026-01-05');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Alimentación').id, '100', '2026-01-06');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Alimentación').id, '50.25', '2026-01-07');
      const res = await excel(p.agente);
      expect(XLSX.read(res.body).SheetNames).toEqual(['Movimientos', 'Resumen']);
      const resumen = hoja(res, 'Resumen');
      expect(resumen[0]).toEqual(['Moneda', 'Tipo', 'Categoría', 'Cantidad', 'Total']);
      expect(resumen).toContainEqual(['PEN', 'Gasto', 'Alimentación', 2, 150.25]);
      expect(resumen).toContainEqual(['PEN', 'Ingreso', p.sueldo.nombre, 1, 3000]);
    });

    it('Respeta los filtros del historial', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Salud').id, '10', '2026-01-02');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Transporte').id, '20', '2026-01-03');
      const res = await excel(p.agente, `?categoriaId=${p.gasto('Salud').id}`);
      expect(hoja(res, 'Movimientos')).toHaveLength(2);
    });

    it('Sin movimientos: 400 con "No hay datos disponibles para exportar"', async () => {
      const { agente } = await preparar();
      const res = await agente.get('/api/v1/reportes/movimientos.xlsx');
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('No hay datos disponibles para exportar');
    });
  });

  describe('HU-16 · PDF', () => {
    it('Exportación exitosa: descarga un PDF válido', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Alimentación').id, '80', '2026-01-08');
      const res = await pdf(p.agente);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('Sin filtros usa el mes en curso e indica el período en el encabezado', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Salud').id, '30', '2026-01-10');
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Salud').id, '99', '2025-12-10');
      const texto = (await pdf(p.agente)).body.toString('latin1');
      expect(texto).toContain('2026-01-01 al 2026-01-31');
      expect(texto).not.toContain('2025-12-10');
    });

    it('Con varias monedas muestra ingresos, gastos y balance de cada una', async () => {
      const p = await preparar();
      const pen = await p.cuenta('PEN');
      const usd = await p.cuenta('USD');
      await mover(p.agente, pen.id, 'ingreso', p.sueldo.id, '1000', '2026-01-05');
      await mover(p.agente, usd.id, 'gasto', p.gasto('Salud').id, '40', '2026-01-06');
      const texto = (await pdf(p.agente)).body.toString('latin1');
      expect(texto).toContain('PEN');
      expect(texto).toContain('USD');
      expect(texto).toContain('1,000.00');
      expect(texto).toContain('-40.00');
    });

    it('Sin movimientos responde 400', async () => {
      const { agente } = await preparar();
      expect((await agente.get('/api/v1/reportes/movimientos.pdf')).status).toBe(400);
    });
  });

  describe('HU-31 · monedas, límite y aislamiento', () => {
    it('Excel con varias monedas: el resumen separa los totales por moneda', async () => {
      const p = await preparar();
      const pen = await p.cuenta('PEN');
      const usd = await p.cuenta('USD');
      await mover(p.agente, pen.id, 'gasto', p.gasto('Salud').id, '100', '2026-01-06');
      await mover(p.agente, usd.id, 'gasto', p.gasto('Salud').id, '30', '2026-01-07');
      const resumen = hoja(await excel(p.agente), 'Resumen');
      expect(resumen).toContainEqual(['PEN', 'Gasto', 'Salud', 1, 100]);
      expect(resumen).toContainEqual(['USD', 'Gasto', 'Salud', 1, 30]);
    });

    it('Más de 5000 movimientos: no genera el archivo y explica cómo reducirlo', async () => {
      const p = await preparar();
      const cuenta = await p.cuenta();
      await mover(p.agente, cuenta.id, 'gasto', p.gasto('Salud').id, '1', '2026-01-02');
      // Acceso directo a la colección: el plugin de inquilino bloquea las consultas sin tenantId.
      const copia = await Movimiento.collection.findOne({ cuentaId: new mongoose.Types.ObjectId(cuenta.id) });
      await Movimiento.collection.insertMany(
        Array.from({ length: 5000 }, () => ({ ...copia, _id: new mongoose.Types.ObjectId() })),
      );
      const res = await p.agente.get('/api/v1/reportes/movimientos.xlsx');
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe(
        'El reporte supera los 5000 movimientos. Reduce el período o aplica más filtros',
      );
    });

    it('Reporte aislado por usuario y sin sesión responde 401', async () => {
      const a = await preparar();
      const b = await preparar();
      const cuentaA = await a.cuenta();
      const cuentaB = await b.cuenta();
      await mover(a.agente, cuentaA.id, 'gasto', a.gasto('Salud').id, '11', '2026-01-02', 'Solo de A');
      await mover(b.agente, cuentaB.id, 'gasto', b.gasto('Salud').id, '22', '2026-01-02', 'Solo de B');
      const filas = hoja(await excel(a.agente), 'Movimientos');
      expect(filas).toHaveLength(2);
      expect(filas[1][6]).toBe('Solo de A');
      expect((await request(e.app).get('/api/v1/reportes/movimientos.pdf')).status).toBe(401);
    });

    it('Filtros inválidos: 400', async () => {
      const { agente } = await preparar();
      expect((await agente.get('/api/v1/reportes/movimientos.pdf?desde=2026-13-45')).status).toBe(400);
    });
  });
});
