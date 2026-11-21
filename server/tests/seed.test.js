// RT-06 (datos de demostración) y RT-07 (primer administrador) contra un replica set en memoria.
import mongoose from 'mongoose';
import { cargarDemo, crearAdministrador, validarEntorno } from '../scripts/seed.js';
import { iniciarReplicaSet } from './helpers/baseDatos.js';

const coleccion = (nombre) => mongoose.connection.collection(nombre);
const aCentimos = (decimal) => Math.round(Number(decimal.toString()) * 100);

describe('seed (RT-06, RT-07)', () => {
  let replica;

  beforeAll(async () => {
    replica = await iniciarReplicaSet();
    await mongoose.connect(replica.getUri());
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await replica.stop();
  });
  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('RT-06 · datos de demostración', () => {
    it('crea administrador y usuarios demo con cuentas, categorías, movimientos y presupuestos que cuadran', async () => {
      const total = await cargarDemo({ password: 'Demo1234' });
      expect(total).toMatchObject({ usuarios: 4 });
      expect(total.cuentas).toBeGreaterThan(0);
      expect(total.movimientos).toBeGreaterThan(0);
      expect(total.presupuestos).toBeGreaterThan(0);

      const admin = await coleccion('usuarios').findOne({ email: 'admin@demo.finanzas.test' });
      expect(admin.rol).toBe('admin');
      expect(admin.passwordHash).not.toContain('Demo1234');

      // Verificación independiente de la del script: saldoActual = saldoInicial + ingresos − gastos.
      for (const cuenta of await coleccion('cuentas').find().toArray()) {
        const movimientos = await coleccion('movimientos').find({ cuentaId: cuenta._id }).toArray();
        const neto = movimientos.reduce(
          (suma, m) => suma + (m.tipo === 'ingreso' ? 1 : -1) * aCentimos(m.monto),
          0,
        );
        expect(aCentimos(cuenta.saldoActual)).toBe(aCentimos(cuenta.saldoInicial) + neto);
      }
    });

    it('aísla cada usuario por tenantId y usuarioId', async () => {
      await cargarDemo({ password: 'Demo1234' });
      const usuarios = await coleccion('usuarios').find().toArray();
      expect(new Set(usuarios.map((u) => u.tenantId)).size).toBe(usuarios.length);
      for (const nombre of ['categorias', 'cuentas', 'movimientos', 'presupuestos']) {
        for (const doc of await coleccion(nombre).find().toArray()) {
          const dueño = usuarios.find((u) => u._id.equals(doc.usuarioId));
          expect(dueño?.tenantId).toBe(doc.tenantId);
        }
      }
    });

    it('cubre todos los estados: varias monedas, presupuesto normal, en alerta y excedido, y un usuario sin movimientos', async () => {
      await cargarDemo({ password: 'Demo1234' });
      const monedas = await coleccion('cuentas').distinct('moneda');
      expect(monedas.sort()).toEqual(['EUR', 'PEN', 'USD']);

      const sin = await coleccion('usuarios').findOne({ email: 'sofia.nueva@demo.finanzas.test' });
      expect(await coleccion('movimientos').countDocuments({ tenantId: sin.tenantId })).toBe(0);
      expect(await coleccion('cuentas').countDocuments({ tenantId: sin.tenantId })).toBe(0);

      const ana = await coleccion('usuarios').findOne({ email: 'ana.torres@demo.finanzas.test' });
      const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
      const periodoActual = hoy.slice(0, 7);
      const presupuestos = await coleccion('presupuestos')
        .find({ tenantId: ana.tenantId, periodo: periodoActual, moneda: 'PEN' })
        .toArray();
      const gastos = await coleccion('movimientos')
        .find({ tenantId: ana.tenantId, tipo: 'gasto', moneda: 'PEN' })
        .toArray();
      const avances = presupuestos.map((p) => {
        const gastado = gastos
          .filter((m) => m.fecha.toISOString().startsWith(periodoActual))
          .filter((m) => (p.categoriaId ? m.categoriaId.equals(p.categoriaId) : true))
          .reduce((suma, m) => suma + aCentimos(m.monto), 0);
        return gastado / aCentimos(p.monto);
      });
      expect(avances.some((a) => a < 0.8)).toBe(true); // normal
      expect(avances.some((a) => a >= 0.8 && a <= 1)).toBe(true); // en alerta
      expect(avances.some((a) => a > 1)).toBe(true); // excedido
    });

    it('al repetirse reemplaza solo los datos demo y no toca a los demás usuarios', async () => {
      await cargarDemo({ password: 'Demo1234' });
      const real = {
        _id: new mongoose.Types.ObjectId(),
        tenantId: 'real-1',
        email: 'persona@correo.com',
        rol: 'usuario',
      };
      await coleccion('usuarios').insertOne(real);
      await coleccion('cuentas').insertOne({ tenantId: 'real-1', usuarioId: real._id, nombre: 'Mi cuenta' });
      const antes = await coleccion('usuarios').countDocuments({ email: /@demo\.finanzas\.test$/ });

      await cargarDemo({ password: 'Demo1234' });

      expect(await coleccion('usuarios').countDocuments({ email: /@demo\.finanzas\.test$/ })).toBe(antes);
      expect(await coleccion('usuarios').findOne({ email: 'persona@correo.com' })).toEqual(real);
      expect(await coleccion('cuentas').countDocuments({ tenantId: 'real-1' })).toBe(1);
      expect(await coleccion('usuarios').countDocuments()).toBe(antes + 1);
    });

    describe('entorno protegido', () => {
      const local = 'mongodb://127.0.0.1:27017/finanzas';
      const atlas = 'mongodb+srv://u:p@cluster0.abcde.mongodb.net/finanzas';

      it('rechaza producción', () => {
        expect(() => validarEntorno({ uri: local, entorno: 'production' })).toThrow(/producción/);
      });
      it('rechaza una base remota sin autorización explícita', () => {
        expect(() => validarEntorno({ uri: atlas, entorno: 'development' })).toThrow(/no es local/);
        expect(() =>
          validarEntorno({ uri: 'mongodb://servidor.remoto:27017/db', entorno: 'development' }),
        ).toThrow(/no es local/);
      });
      it('acepta una base local y una remota con --permitir-remoto', () => {
        expect(() => validarEntorno({ uri: local, entorno: 'development' })).not.toThrow();
        expect(() =>
          validarEntorno({ uri: atlas, entorno: 'development', permitirRemoto: true }),
        ).not.toThrow();
      });
      it('no confunde un host remoto que contiene "localhost" en su nombre', () => {
        expect(() =>
          validarEntorno({ uri: 'mongodb://localhost.evil.com:27017/db', entorno: 'development' }),
        ).toThrow(/no es local/);
      });
      it('no restringe la creación del administrador (modo --solo-admin)', () => {
        expect(() => validarEntorno({ uri: atlas, entorno: 'production', soloAdmin: true })).not.toThrow();
      });
    });
  });

  describe('RT-07 · primer administrador', () => {
    const datos = { email: 'Jefe@Empresa.com', password: 'Secreta123' };

    it('crea la cuenta con rol admin, su propio tenantId y sus categorías', async () => {
      expect(await crearAdministrador(datos)).toBe('creado');
      const admin = await coleccion('usuarios').findOne({ email: 'jefe@empresa.com' });
      expect(admin).toMatchObject({ rol: 'admin', activo: true });
      expect(admin.tenantId).toBeTruthy();
      expect(admin.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(await coleccion('categorias').countDocuments({ tenantId: admin.tenantId })).toBeGreaterThan(0);
    });

    it('no promueve a un usuario estándar existente ni lo modifica', async () => {
      const estandar = {
        _id: new mongoose.Types.ObjectId(),
        tenantId: 't-1',
        email: 'jefe@empresa.com',
        rol: 'usuario',
      };
      await coleccion('usuarios').insertOne(estandar);
      await expect(crearAdministrador(datos)).rejects.toThrow(/otro ADMIN_EMAIL|gestión de roles/);
      expect(await coleccion('usuarios').findOne({ email: 'jefe@empresa.com' })).toEqual(estandar);
    });

    it('con configuración incompleta o inválida falla sin modificar la base', async () => {
      await expect(crearAdministrador({ email: '', password: 'Secreta123' })).rejects.toThrow(/ADMIN_EMAIL/);
      await expect(crearAdministrador({ email: 'a@b.com', password: '' })).rejects.toThrow(/ADMIN_PASSWORD/);
      await expect(crearAdministrador({ email: 'a@b.com', password: 'corta' })).rejects.toThrow(
        /ADMIN_PASSWORD/,
      );
      expect(await coleccion('usuarios').countDocuments()).toBe(0);
    });

    it('al repetirse informa que no hay cambios y no duplica la cuenta', async () => {
      await crearAdministrador(datos);
      expect(await crearAdministrador(datos)).toBe('sin cambios');
      expect(await coleccion('usuarios').countDocuments({ email: 'jefe@empresa.com' })).toBe(1);
    });
  });
});
