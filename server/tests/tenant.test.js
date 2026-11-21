import mongoose from 'mongoose';
import { conectar, desconectar } from '../src/config/baseDatos.js';
import { tenantPlugin, TenantGuardError } from '../src/models/plugins/tenant.plugin.js';
import { RepositorioBase } from '../src/repositories/base.repository.js';
import { iniciarReplicaSet } from './helpers/baseDatos.js';

const esquema = new mongoose.Schema({ nombre: String, orden: Number }, { timestamps: true });
esquema.plugin(tenantPlugin);
const Elemento = mongoose.model('ElementoPrueba', esquema);

const TENANT_A = 'a0a0a0a0-0000-4000-8000-000000000001';
const TENANT_B = 'b0b0b0b0-0000-4000-8000-000000000002';
const USUARIO = new mongoose.Types.ObjectId();

describe('aislamiento por tenantId (RT-02)', () => {
  let replica;
  let repoA;
  let repoB;

  beforeAll(async () => {
    replica = await iniciarReplicaSet();
    await conectar(replica.getUri());
    await Elemento.init();
  });
  afterAll(async () => {
    await desconectar();
    await replica.stop();
  });
  beforeEach(async () => {
    await Elemento.collection.deleteMany({});
    repoA = new RepositorioBase(Elemento, TENANT_A);
    repoB = new RepositorioBase(Elemento, TENANT_B);
  });

  it('crea documentos con el tenantId del repositorio, ignorando el que venga en los datos', async () => {
    const creado = await repoA.crear({ nombre: 'mío', usuarioId: USUARIO, tenantId: TENANT_B });
    expect(creado.tenantId).toBe(TENANT_A);
  });

  it('un inquilino no accede a los datos de otro: lectura, listado, conteo, edición y borrado', async () => {
    const delA = await repoA.crear({ nombre: 'secreto de A', usuarioId: USUARIO });

    expect(await repoB.encontrarPorId(delA._id)).toBeNull();
    expect(await repoB.listar()).toEqual({ items: [], total: 0 });
    expect(await repoB.contar()).toBe(0);
    expect(await repoB.actualizarPorId(delA._id, { nombre: 'hackeado' })).toBeNull();
    expect(await repoB.eliminarPorId(delA._id)).toBeNull();

    const intacto = await repoA.encontrarPorId(delA._id);
    expect(intacto.nombre).toBe('secreto de A');
  });

  it('no permite saltarse el aislamiento pasando otro tenantId en el filtro', async () => {
    await repoA.crear({ nombre: 'de A', usuarioId: USUARIO });
    const { items } = await repoB.listar({ tenantId: TENANT_A });
    expect(items).toHaveLength(0);
  });

  it('lista con paginación y orden, solo del inquilino', async () => {
    for (let i = 1; i <= 5; i++) await repoA.crear({ nombre: `a${i}`, orden: i, usuarioId: USUARIO });
    await repoB.crear({ nombre: 'b1', orden: 99, usuarioId: USUARIO });

    const pagina = await repoA.listar({}, { page: 2, limit: 2, sort: '-orden' });
    expect(pagina.total).toBe(5);
    expect(pagina.items.map((e) => e.orden)).toEqual([3, 2]);
  });

  it('las agregaciones siempre empiezan filtrando por tenantId', async () => {
    await repoA.crear({ nombre: 'x', orden: 10, usuarioId: USUARIO });
    await repoA.crear({ nombre: 'y', orden: 5, usuarioId: USUARIO });
    await repoB.crear({ nombre: 'z', orden: 100, usuarioId: USUARIO });

    const [suma] = await repoA.agregar([{ $group: { _id: null, total: { $sum: '$orden' } } }]);
    expect(suma.total).toBe(15);
  });

  it('una consulta sin tenantId falla antes de llegar a la base de datos', async () => {
    await repoA.crear({ nombre: 'dato', usuarioId: USUARIO });

    await expect(Elemento.find({})).rejects.toBeInstanceOf(TenantGuardError);
    await expect(Elemento.findOne({ nombre: 'dato' })).rejects.toThrow(/sin tenantId/);
    await expect(Elemento.countDocuments({})).rejects.toBeInstanceOf(TenantGuardError);
    await expect(Elemento.updateMany({}, { nombre: 'x' })).rejects.toBeInstanceOf(TenantGuardError);
    await expect(Elemento.deleteMany({})).rejects.toBeInstanceOf(TenantGuardError);
    await expect(Elemento.aggregate([{ $group: { _id: null } }])).rejects.toBeInstanceOf(TenantGuardError);
    await expect(Elemento.find({ tenantId: undefined })).rejects.toBeInstanceOf(TenantGuardError);
    await expect(Elemento.find({ tenantId: { $ne: TENANT_A } })).rejects.toBeInstanceOf(TenantGuardError);

    expect(await Elemento.collection.countDocuments()).toBe(1); // nada se modificó
  });

  it('un repositorio no se puede construir sin tenantId', () => {
    expect(() => new RepositorioBase(Elemento)).toThrow(/requiere un tenantId/);
    expect(() => new RepositorioBase(Elemento, '')).toThrow(/requiere un tenantId/);
  });

  it('ignora identificadores con formato inválido en lugar de fallar', async () => {
    expect(await repoA.encontrarPorId('no-es-un-id')).toBeNull();
    expect(await repoA.actualizarPorId('xyz', {})).toBeNull();
    expect(await repoA.eliminarPorId(undefined)).toBeNull();
  });

  it('participa en transacciones (replica set)', async () => {
    const sesion = await mongoose.startSession();
    await sesion.withTransaction(async () => {
      await repoA.crear({ nombre: 'dentro', usuarioId: USUARIO }, { session: sesion });
    });
    await sesion.endSession();
    expect(await repoA.contar()).toBe(1);

    const fallida = await mongoose.startSession();
    await expect(
      fallida.withTransaction(async () => {
        await repoA.crear({ nombre: 'revertido', usuarioId: USUARIO }, { session: fallida });
        throw new Error('falla a mitad de la transacción');
      }),
    ).rejects.toThrow('falla a mitad');
    await fallida.endSession();
    expect(await repoA.contar()).toBe(1);
  });
});
