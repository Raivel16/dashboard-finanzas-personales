// Modelos y repositorios de identidad (usuarios, sesiones, tokens de recuperación) con MongoDB real en memoria.
import mongoose from 'mongoose';
import { conectar, desconectar } from '../src/config/baseDatos.js';
import { Usuario } from '../src/models/usuario.model.js';
import { Sesion } from '../src/models/sesion.model.js';
import { TokenRecuperacion } from '../src/models/token-recuperacion.model.js';
import { usuarioRepository } from '../src/repositories/usuario.repository.js';
import { sesionRepository } from '../src/repositories/sesion.repository.js';
import { tokenRecuperacionRepository } from '../src/repositories/token-recuperacion.repository.js';
import { iniciarReplicaSet } from './helpers/baseDatos.js';

const AHORA = new Date('2026-01-15T12:00:00.000Z');
const enMinutos = (m) => new Date(AHORA.getTime() + m * 60_000);

const datosUsuario = (extra = {}) => ({
  tenantId: crypto.randomUUID(),
  nombre: 'Ana Torres',
  email: `ana${Math.random().toString(36).slice(2)}@correo.com`,
  passwordHash: 'hash',
  ...extra,
});

describe('identidad: modelos y repositorios', () => {
  let replica;

  beforeAll(async () => {
    replica = await iniciarReplicaSet();
    await conectar(replica.getUri());
    await Promise.all([Usuario.init(), Sesion.init(), TokenRecuperacion.init()]);
  });
  afterAll(async () => {
    await desconectar();
    await replica.stop();
  });

  describe('índices y valores por defecto', () => {
    it('usuarios: email y tenantId únicos', async () => {
      const indices = await Usuario.collection.indexes();
      const unicos = indices.filter((i) => i.unique).map((i) => Object.keys(i.key)[0]);
      expect(unicos).toEqual(expect.arrayContaining(['email', 'tenantId']));
    });

    it('sesiones y tokens: TTL sobre su vencimiento y colecciones con el nombre del diseño', async () => {
      const ttl = async (modelo, campo) =>
        (await modelo.collection.indexes()).find((i) => i.key[campo] && i.expireAfterSeconds === 0);
      expect(await ttl(Sesion, 'expiraAbsoluta')).toBeTruthy();
      expect(await ttl(TokenRecuperacion, 'expiraEn')).toBeTruthy();
      expect(Sesion.collection.collectionName).toBe('sesiones');
      expect(TokenRecuperacion.collection.collectionName).toBe('tokensrecuperacion');
    });

    it('crea usuarios con rol usuario, moneda PEN, sin intentos y activos; guarda el correo en minúsculas', async () => {
      const u = await usuarioRepository.crear(datosUsuario({ email: 'Mixto@Correo.COM' }));
      expect(u).toMatchObject({
        rol: 'usuario',
        monedaPrincipal: 'PEN',
        intentosFallidos: 0,
        bloqueadoHasta: null,
        activo: true,
        email: 'mixto@correo.com',
      });
      expect((await usuarioRepository.buscarPorEmail('MIXTO@correo.com')).tenantId).toBe(u.tenantId);
    });

    it('rechaza un correo duplicado y un tenantId duplicado', async () => {
      const base = datosUsuario();
      await usuarioRepository.crear(base);
      await expect(
        usuarioRepository.crear({ ...datosUsuario(), email: base.email.toUpperCase() }),
      ).rejects.toMatchObject({ code: 11000 });
      await expect(
        usuarioRepository.crear({ ...datosUsuario(), tenantId: base.tenantId }),
      ).rejects.toMatchObject({ code: 11000 });
    });

    it('buscarPorId tolera ids inválidos', async () => {
      expect(await usuarioRepository.buscarPorId('no-es-un-id')).toBeNull();
      expect(await sesionRepository.buscarPorId('no-es-un-id')).toBeNull();
    });
  });

  describe('intentos fallidos (atómicos)', () => {
    const opciones = (reloj = AHORA) => ({
      maximo: 3,
      bloqueoHasta: new Date(reloj.getTime() + 5 * 60_000),
      ahora: reloj,
    });

    it('bloquea 5 minutos al tercer fallo y no antes', async () => {
      const u = await usuarioRepository.crear(datosUsuario());
      expect((await usuarioRepository.registrarFallo(u._id, opciones())).bloqueadoHasta).toBeNull();
      expect((await usuarioRepository.registrarFallo(u._id, opciones())).bloqueadoHasta).toBeNull();
      const tercero = await usuarioRepository.registrarFallo(u._id, opciones());
      expect(tercero.intentosFallidos).toBe(3);
      expect(tercero.bloqueadoHasta).toEqual(enMinutos(5));
    });

    it('seis solicitudes simultáneas no burlan el contador: cuenta todas y queda bloqueado', async () => {
      const u = await usuarioRepository.crear(datosUsuario());
      await Promise.all(Array.from({ length: 6 }, () => usuarioRepository.registrarFallo(u._id, opciones())));
      const despues = await usuarioRepository.buscarPorId(u._id);
      expect(despues.intentosFallidos).toBe(6);
      expect(despues.bloqueadoHasta).toEqual(enMinutos(5));
    });

    it('si el bloqueo ya venció, el conteo vuelve a empezar en 1 y se levanta el bloqueo', async () => {
      const u = await usuarioRepository.crear(datosUsuario());
      for (let i = 0; i < 3; i += 1) await usuarioRepository.registrarFallo(u._id, opciones());
      const luego = await usuarioRepository.registrarFallo(u._id, opciones(enMinutos(6)));
      expect(luego.intentosFallidos).toBe(1);
      expect(luego.bloqueadoHasta).toBeNull();
    });

    it('reiniciarIntentos y actualizarPassword levantan el bloqueo', async () => {
      const u = await usuarioRepository.crear(datosUsuario());
      for (let i = 0; i < 3; i += 1) await usuarioRepository.registrarFallo(u._id, opciones());
      await usuarioRepository.reiniciarIntentos(u._id);
      expect(await usuarioRepository.buscarPorId(u._id)).toMatchObject({
        intentosFallidos: 0,
        bloqueadoHasta: null,
      });

      for (let i = 0; i < 3; i += 1) await usuarioRepository.registrarFallo(u._id, opciones());
      await usuarioRepository.actualizarPassword(u._id, 'nuevo-hash');
      expect(await usuarioRepository.buscarPorId(u._id)).toMatchObject({
        passwordHash: 'nuevo-hash',
        intentosFallidos: 0,
        bloqueadoHasta: null,
      });
    });
  });

  describe('sesiones', () => {
    const nueva = async (usuarioId, hash = crypto.randomUUID()) =>
      sesionRepository.crear({
        usuarioId,
        tokenHash: hash,
        ultimaActividad: AHORA,
        expiraInactividad: enMinutos(30),
        expiraAbsoluta: new Date(AHORA.getTime() + 7 * 86_400_000),
      });

    it('rota el token: la búsqueda encuentra el vigente y el anterior, y solo una rotación simultánea gana', async () => {
      const usuarioId = new mongoose.Types.ObjectId();
      const s = await nueva(usuarioId, 'hash-1');
      const rotaciones = await Promise.all(
        ['hash-2a', 'hash-2b'].map((nuevo) =>
          sesionRepository.rotar(s._id, {
            tokenHashActual: 'hash-1',
            tokenHashNuevo: nuevo,
            ahora: AHORA,
            expiraInactividad: enMinutos(30),
          }),
        ),
      );
      expect(rotaciones.filter(Boolean)).toHaveLength(1);
      const ganador = rotaciones.find(Boolean);
      expect(ganador.tokenHashAnterior).toBe('hash-1');
      expect((await sesionRepository.buscarPorTokenHash('hash-1'))._id).toEqual(s._id);
      expect((await sesionRepository.buscarPorTokenHash(ganador.tokenHash))._id).toEqual(s._id);
      expect(await sesionRepository.buscarPorTokenHash('otro')).toBeNull();
    });

    it('no rota una sesión revocada', async () => {
      const s = await nueva(new mongoose.Types.ObjectId(), 'h-rev');
      await sesionRepository.revocar(s._id, AHORA);
      const r = await sesionRepository.rotar(s._id, {
        tokenHashActual: 'h-rev',
        tokenHashNuevo: 'h-n',
        ahora: AHORA,
        expiraInactividad: enMinutos(30),
      });
      expect(r).toBeNull();
    });

    it('revocar afecta una sola sesión; revocarTodasDeUsuario, solo las de ese usuario', async () => {
      const a = new mongoose.Types.ObjectId();
      const b = new mongoose.Types.ObjectId();
      const [a1, a2, b1] = [await nueva(a), await nueva(a), await nueva(b)];
      await sesionRepository.revocar(a1._id, AHORA);
      expect((await sesionRepository.buscarPorId(a1._id)).revocadaEn).toEqual(AHORA);
      expect((await sesionRepository.buscarPorId(a2._id)).revocadaEn).toBeNull();

      await sesionRepository.revocarTodasDeUsuario(a, enMinutos(1));
      expect((await sesionRepository.buscarPorId(a2._id)).revocadaEn).toEqual(enMinutos(1));
      expect((await sesionRepository.buscarPorId(a1._id)).revocadaEn).toEqual(AHORA); // conserva la fecha original
      expect((await sesionRepository.buscarPorId(b1._id)).revocadaEn).toBeNull();
    });

    it('extenderActividad mueve el vencimiento por inactividad', async () => {
      const s = await nueva(new mongoose.Types.ObjectId());
      await sesionRepository.extenderActividad(s._id, {
        ahora: enMinutos(10),
        expiraInactividad: enMinutos(40),
      });
      expect(await sesionRepository.buscarPorId(s._id)).toMatchObject({
        ultimaActividad: enMinutos(10),
        expiraInactividad: enMinutos(40),
      });
    });
  });

  describe('tokens de recuperación', () => {
    const nuevo = (usuarioId, extra = {}) =>
      tokenRecuperacionRepository.crear({
        usuarioId,
        tokenHash: crypto.randomUUID(),
        creadoEn: AHORA,
        expiraEn: enMinutos(30),
        ...extra,
      });

    it('se marca como usado una sola vez, aun con solicitudes simultáneas', async () => {
      const t = await nuevo(new mongoose.Types.ObjectId());
      const resultados = await Promise.all(
        [1, 2, 3].map(() => tokenRecuperacionRepository.marcarUsado(t._id, AHORA)),
      );
      expect(resultados.filter(Boolean)).toHaveLength(1);
    });

    it('buscarVigenteReciente respeta uso, vencimiento y antigüedad', async () => {
      const u = new mongoose.Types.ObjectId();
      const t = await nuevo(u);
      const consulta = (ahora, desde) =>
        tokenRecuperacionRepository.buscarVigenteReciente(u, { ahora, desde });
      expect(await consulta(enMinutos(0.5), enMinutos(-0.5))).toBeTruthy();
      expect(await consulta(enMinutos(2), enMinutos(1))).toBeNull(); // creado hace más de 1 minuto
      expect(await consulta(enMinutos(31), enMinutos(-1))).toBeNull(); // vencido
      await tokenRecuperacionRepository.marcarUsado(t._id, AHORA);
      expect(await consulta(enMinutos(0.5), enMinutos(-0.5))).toBeNull(); // usado
    });

    it('invalidarPendientes solo afecta los tokens sin usar de ese usuario', async () => {
      const a = new mongoose.Types.ObjectId();
      const otro = new mongoose.Types.ObjectId();
      const t1 = await nuevo(a);
      const t2 = await nuevo(otro);
      await tokenRecuperacionRepository.invalidarPendientes(a, enMinutos(1));
      expect((await tokenRecuperacionRepository.buscarPorHash(t1.tokenHash)).usadoEn).toEqual(enMinutos(1));
      expect((await tokenRecuperacionRepository.buscarPorHash(t2.tokenHash)).usadoEn).toBeNull();
    });
  });
});
