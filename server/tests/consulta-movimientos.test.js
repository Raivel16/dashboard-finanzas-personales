// HU-10 · historial de movimientos y HU-11 · filtros combinables, sobre la API.
import { iniciarEntorno } from './helpers/api.js';

describe('consulta de movimientos', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  async function preparar() {
    const u = await e.registrar();
    const { agente } = await e.iniciarSesion(u);
    const categorias = (await agente.get('/api/v1/categorias?limit=100')).body.data;
    const crearCuenta = async (nombre) =>
      (await agente.post('/api/v1/cuentas').send({ nombre, tipo: 'banco', moneda: 'PEN', saldoInicial: '1000' })).body.data;
    return {
      agente,
      alimentacion: categorias.find((c) => c.nombre === 'Alimentación'),
      transporte: categorias.find((c) => c.nombre === 'Transporte'),
      sueldo: categorias.find((c) => c.tipo === 'ingreso'),
      crearCuenta,
    };
  }
  const registrar = (agente, datos) => agente.post('/api/v1/movimientos').send(datos);
  const consultar = async (agente, consulta = '') => agente.get(`/api/v1/movimientos?${consulta}`);

  describe('HU-10 · historial', () => {
    it('Consulta exitosa: al menos 10 movimientos, paginados por fecha descendente y con todos sus datos', async () => {
      const p = await preparar();
      const cuenta = await p.crearCuenta('Efectivo');
      for (let dia = 1; dia <= 12; dia += 1) {
        const fecha = `2026-01-${String(dia).padStart(2, '0')}`;
        await registrar(p.agente, {
          tipo: 'gasto',
          monto: `${dia}.00`,
          fecha,
          categoriaId: p.alimentacion.id,
          cuentaId: cuenta.id,
          descripcion: `Compra ${dia}`,
        });
      }
      const primera = await consultar(p.agente, 'limit=5');
      expect(primera.body.meta).toMatchObject({ page: 1, limit: 5, total: 12, totalPages: 3 });
      expect(primera.body.data.map((m) => m.fecha)).toEqual([
        '2026-01-12',
        '2026-01-11',
        '2026-01-10',
        '2026-01-09',
        '2026-01-08',
      ]);
      expect(primera.body.data[0]).toMatchObject({
        tipo: 'gasto',
        categoriaId: p.alimentacion.id,
        cuentaId: cuenta.id,
        monto: '12.00',
        descripcion: 'Compra 12',
      });
      const ultima = await consultar(p.agente, 'limit=5&page=3');
      expect(ultima.body.data.map((m) => m.fecha)).toEqual(['2026-01-02', '2026-01-01']);
    });

    it('Detalle de un movimiento: GET por id devuelve todos sus datos', async () => {
      const p = await preparar();
      const cuenta = await p.crearCuenta('Efectivo');
      const mov = (
        await registrar(p.agente, {
          tipo: 'ingreso',
          monto: '300.50',
          fecha: '2026-01-05',
          categoriaId: p.sueldo.id,
          cuentaId: cuenta.id,
          descripcion: 'Pago de enero',
        })
      ).body.data;
      const detalle = (await p.agente.get(`/api/v1/movimientos/${mov.id}`)).body.data;
      expect(detalle).toMatchObject({
        id: mov.id,
        tipo: 'ingreso',
        monto: '300.50',
        moneda: 'PEN',
        fecha: '2026-01-05',
        categoriaId: p.sueldo.id,
        cuentaId: cuenta.id,
        descripcion: 'Pago de enero',
      });
      expect(detalle.creadoEn).toBeTruthy();
    });

    it('Historial sin movimientos: lista vacía y total 0', async () => {
      const p = await preparar();
      const res = await consultar(p.agente);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });
  });

  describe('HU-11 · filtros', () => {
    async function conHistorial() {
      const p = await preparar();
      const cuentaA = await p.crearCuenta('Efectivo');
      const cuentaB = await p.crearCuenta('Cuenta Bancaria');
      const alta = (cuenta, tipo, categoria, fecha, monto) =>
        registrar(p.agente, { tipo, monto, fecha, categoriaId: categoria.id, cuentaId: cuenta.id });
      await alta(cuentaA, 'gasto', p.alimentacion, '2025-08-05', '10');
      await alta(cuentaA, 'gasto', p.transporte, '2025-08-10', '20');
      await alta(cuentaB, 'gasto', p.alimentacion, '2025-09-02', '30');
      await alta(cuentaB, 'ingreso', p.sueldo, '2025-08-15', '500');
      await alta(cuentaA, 'ingreso', p.sueldo, '2025-08-20', '700');
      return { ...p, cuentaA, cuentaB };
    }
    const montos = async (p, consulta) =>
      (await consultar(p.agente, `${consulta}&sort=monto&limit=100`)).body.data.map((m) => m.monto);

    it('Filtrado exitoso por fecha y categoría: solo los que cumplen ambos criterios', async () => {
      const p = await conHistorial();
      expect(await montos(p, `desde=2025-08-01&hasta=2025-08-31&categoriaId=${p.alimentacion.id}`)).toEqual(['10.00']);
    });

    it('Combinación exitosa de filtros: tipo ingreso y la cuenta bancaria', async () => {
      const p = await conHistorial();
      expect(await montos(p, 'tipo=ingreso')).toEqual(['500.00', '700.00']);
      expect(await montos(p, `tipo=ingreso&cuentaId=${p.cuentaB.id}`)).toEqual(['500.00']);
    });

    it('Filtro rechazado por rango de fechas inválido: 400 con el mensaje exacto', async () => {
      const p = await conHistorial();
      const res = await consultar(p.agente, 'desde=2025-08-31&hasta=2025-08-01');
      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([
        { campo: 'hasta', mensaje: 'La fecha inicial no puede ser mayor a la fecha final' },
      ]);
    });

    it('Resultado vacío por filtros sin coincidencias: lista vacía y total 0', async () => {
      const p = await conHistorial();
      const res = await consultar(p.agente, `desde=2025-01-01&hasta=2025-01-31&categoriaId=${p.transporte.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('Los filtros no cambian el saldo resultante ni muestran movimientos de otra persona', async () => {
      const p = await conHistorial();
      const todos = (await consultar(p.agente, 'sort=fecha&limit=100')).body.data;
      const filtrado = (await consultar(p.agente, `cuentaId=${p.cuentaA.id}&sort=fecha&limit=100`)).body.data;
      for (const mov of filtrado) {
        expect(mov.saldoResultante).toBe(todos.find((t) => t.id === mov.id).saldoResultante);
      }
      const otra = await preparar();
      expect((await consultar(otra.agente, `cuentaId=${p.cuentaA.id}`)).body.data).toEqual([]);
    });
  });
});
