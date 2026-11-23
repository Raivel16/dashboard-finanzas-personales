// HU-06 · categorías propias, HU-24 · categorías predeterminadas y lectura de administrador (HU-04, HU-05, HU-22).
import mongoose from 'mongoose';
import { CATEGORIAS_PREDETERMINADAS, ROLES } from '@finanzas/shared';
import { CLAVE, iniciarEntorno } from './helpers/api.js';

const NO_EXISTE = 'El recurso solicitado no existe o no tienes permiso para acceder a él';
const DUPLICADA = 'Ya existe una categoría con ese nombre';
const CON_MOVIMIENTOS =
  'No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero';

describe('categorías', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const categorias = () => mongoose.connection.collection('categorias');
  const movimientos = () => mongoose.connection.collection('movimientos');
  const usuarios = () => mongoose.connection.collection('usuarios');

  async function sesion(extra = {}) {
    const u = await e.registrar(extra);
    const { agente } = await e.iniciarSesion(u);
    return { u, agente };
  }
  const listar = async (agente, consulta = '?limit=100') =>
    (await agente.get(`/api/v1/categorias${consulta}`)).body.data;
  const porNombre = (lista, nombre) => lista.find((c) => c.nombre === nombre);
  const crear = (agente, datos) => agente.post('/api/v1/categorias').send(datos);

  describe('HU-06 · administrar categorías', () => {
    it('Creación exitosa: queda vinculada a su tenantId y usuarioId y aparece en el listado', async () => {
      const { u, agente } = await sesion();
      const res = await crear(agente, { nombre: ' Mascotas ', tipo: 'gasto', icono: 'dog' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ nombre: 'Mascotas', tipo: 'gasto', icono: 'dog' });

      const usuario = await usuarios().findOne({ email: u.email });
      const guardada = await categorias().findOne({ _id: new mongoose.Types.ObjectId(res.body.data.id) });
      expect(guardada.tenantId).toBe(usuario.tenantId);
      expect(String(guardada.usuarioId)).toBe(String(usuario._id));
      expect(porNombre(await listar(agente), 'Mascotas')).toBeTruthy();
    });

    it('Creación sin ícono usa el ícono por defecto y un ícono inválido se rechaza', async () => {
      const { agente } = await sesion();
      const sin = await crear(agente, { nombre: 'Varios', tipo: 'gasto' });
      expect(sin.body.data.icono).toBe('circle-ellipsis');
      const malo = await crear(agente, { nombre: 'Otra', tipo: 'gasto', icono: 'no-existe' });
      expect(malo.status).toBe(400);
      expect(malo.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Validación: nombre de 2 a 50 caracteres y tipo válido', async () => {
      const { agente } = await sesion();
      for (const datos of [
        { nombre: 'x', tipo: 'gasto' },
        { nombre: 'x'.repeat(51), tipo: 'gasto' },
        { nombre: 'Café', tipo: 'otro' },
        { tipo: 'gasto' },
      ]) {
        const res = await crear(agente, datos);
        expect(res.status).toBe(400);
      }
    });

    it('Edición exitosa: el nombre nuevo se lee en los movimientos históricos (solo guardan categoriaId)', async () => {
      const { u, agente } = await sesion();
      const usuario = await usuarios().findOne({ email: u.email });
      const transporte = porNombre(await listar(agente), 'Transporte');
      await movimientos().insertOne({
        tenantId: usuario.tenantId,
        categoriaId: new mongoose.Types.ObjectId(transporte.id),
      });

      const res = await agente.patch(`/api/v1/categorias/${transporte.id}`).send({ nombre: 'Movilidad' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ nombre: 'Movilidad', tipo: 'gasto', icono: 'bus' });

      const movimiento = await movimientos().findOne({ tenantId: usuario.tenantId });
      expect(Object.keys(movimiento)).not.toContain('categoriaNombre');
      const actual = (await listar(agente)).find((c) => c.id === String(movimiento.categoriaId));
      expect(actual.nombre).toBe('Movilidad');
    });

    it('Edición: el tipo no se puede cambiar, se exige algún cambio y el ícono se actualiza solo', async () => {
      const { agente } = await sesion();
      const comida = porNombre(await listar(agente), 'Alimentación');
      const conTipo = await agente.patch(`/api/v1/categorias/${comida.id}`).send({ tipo: 'ingreso' });
      expect(conTipo.status).toBe(400);
      expect(conTipo.body.error.details[0].mensaje).toBe('El tipo de una categoría no se puede cambiar');
      expect((await agente.patch(`/api/v1/categorias/${comida.id}`).send({})).status).toBe(400);

      const icono = await agente.patch(`/api/v1/categorias/${comida.id}`).send({ icono: 'coffee' });
      expect(icono.body.data).toMatchObject({ nombre: 'Alimentación', icono: 'coffee' });
    });

    it('Creación rechazada por nombre duplicado: 409 con el mensaje exacto, sin distinguir mayúsculas ni tildes', async () => {
      const { agente } = await sesion();
      for (const nombre of ['Transporte', 'transporte', 'TRANSPORTE', ' Transporte ', 'Educacion']) {
        const res = await crear(agente, { nombre, tipo: 'gasto' });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: DUPLICADA });
      }
      // El mismo nombre en el otro tipo sí es válido.
      expect((await crear(agente, { nombre: 'Transporte', tipo: 'ingreso' })).status).toBe(201);
    });

    it('Renombrar a un nombre existente responde 409 y conserva el nombre', async () => {
      const { agente } = await sesion();
      const lista = await listar(agente);
      const res = await agente
        .patch(`/api/v1/categorias/${porNombre(lista, 'Salud').id}`)
        .send({ nombre: 'vivienda' });
      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe(DUPLICADA);
      expect(porNombre(await listar(agente), 'Salud')).toBeTruthy();
    });

    it('Dos creaciones simultáneas con el mismo nombre dejan una sola categoría', async () => {
      const { agente } = await sesion();
      const respuestas = await Promise.all(
        Array.from({ length: 4 }, () => crear(agente, { nombre: 'Gimnasio', tipo: 'gasto' })),
      );
      expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
      expect(respuestas.filter((r) => r.status === 409)).toHaveLength(3);
      expect((await listar(agente)).filter((c) => c.nombre === 'Gimnasio')).toHaveLength(1);
    });

    it('Eliminación impedida por movimientos asociados: 409 con el mensaje exacto y la categoría se conserva', async () => {
      const { u, agente } = await sesion();
      const usuario = await usuarios().findOne({ email: u.email });
      const salud = porNombre(await listar(agente), 'Salud');
      await movimientos().insertOne({
        tenantId: usuario.tenantId,
        categoriaId: new mongoose.Types.ObjectId(salud.id),
      });

      const res = await agente.delete(`/api/v1/categorias/${salud.id}`);
      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: CON_MOVIMIENTOS });
      expect(porNombre(await listar(agente), 'Salud')).toBeTruthy();
    });

    it('Eliminación exitosa de una categoría sin movimientos', async () => {
      const { agente } = await sesion();
      const ventas = porNombre(await listar(agente), 'Ventas');
      const res = await agente.delete(`/api/v1/categorias/${ventas.id}`);
      expect(res.status).toBe(204);
      expect(porNombre(await listar(agente), 'Ventas')).toBeUndefined();
      expect((await agente.delete(`/api/v1/categorias/${ventas.id}`)).status).toBe(404);
    });

    it('Una categoría usada por movimientos de OTRO inquilino sí se puede eliminar', async () => {
      const { agente } = await sesion();
      const otra = porNombre(await listar(agente), 'Otros ingresos');
      await movimientos().insertOne({
        tenantId: 'otro-inquilino',
        categoriaId: new mongoose.Types.ObjectId(otra.id),
      });
      expect((await agente.delete(`/api/v1/categorias/${otra.id}`)).status).toBe(204);
    });

    it('Listado: paginado, filtrable por tipo y ordenado por tipo y nombre sin distinguir tildes', async () => {
      const { agente } = await sesion();
      await crear(agente, { nombre: 'ábaco', tipo: 'gasto' });
      const res = await agente.get('/api/v1/categorias?limit=100');
      expect(res.body.meta).toMatchObject({ page: 1, limit: 100, total: 11, totalPages: 1 });
      const gastos = res.body.data.filter((c) => c.tipo === 'gasto').map((c) => c.nombre);
      expect(gastos[0]).toBe('ábaco');
      expect(gastos).toEqual([...gastos].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })));

      const ingresos = await agente.get('/api/v1/categorias?tipo=ingreso');
      expect(ingresos.body.data.map((c) => c.nombre)).toEqual(['Otros ingresos', 'Sueldo', 'Ventas']);
      const pagina = await agente.get('/api/v1/categorias?limit=4&page=3');
      expect(pagina.body.meta).toMatchObject({ page: 3, limit: 4, total: 11, totalPages: 3 });
      expect(pagina.body.data).toHaveLength(3);
      expect((await agente.get('/api/v1/categorias?limit=500')).status).toBe(400);
    });

    it('Exige sesión', async () => {
      const res = await (await import('supertest')).default(e.app).get('/api/v1/categorias');
      expect(res.status).toBe(401);
    });
  });

  describe('HU-06 / HU-05 · aislamiento entre usuarios', () => {
    it('Otra persona no ve, edita ni elimina una categoría ajena aunque conozca su id (404 genérico)', async () => {
      const a = await sesion();
      const b = await sesion();
      const deA = porNombre(await listar(a.agente), 'Transporte');

      expect(porNombre(await listar(b.agente), 'Transporte').id).not.toBe(deA.id);
      const editar = await b.agente.patch(`/api/v1/categorias/${deA.id}`).send({ nombre: 'Hackeada' });
      const borrar = await b.agente.delete(`/api/v1/categorias/${deA.id}`);
      for (const res of [editar, borrar]) {
        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe(NO_EXISTE);
      }
      expect(porNombre(await listar(a.agente), 'Transporte')).toMatchObject({ id: deA.id });
    });

    it('El cuerpo no puede fijar tenantId ni usuarioId, y un id inválido responde 404', async () => {
      const a = await sesion();
      const b = await sesion();
      const usuarioB = await usuarios().findOne({ email: b.u.email });
      const res = await crear(a.agente, {
        nombre: 'Suplantada',
        tipo: 'gasto',
        tenantId: usuarioB.tenantId,
        usuarioId: String(usuarioB._id),
      });
      expect(res.status).toBe(201);
      const guardada = await categorias().findOne({ _id: new mongoose.Types.ObjectId(res.body.data.id) });
      expect(guardada.tenantId).not.toBe(usuarioB.tenantId);
      expect(porNombre(await listar(b.agente), 'Suplantada')).toBeUndefined();
      expect((await a.agente.delete('/api/v1/categorias/no-es-un-id')).status).toBe(404);
    });
  });

  describe('HU-24 · categorías predeterminadas', () => {
    it('Categorías disponibles tras el registro: 7 de gasto y 3 de ingreso con los nombres de la spec', async () => {
      const { u, agente } = await sesion();
      const lista = await listar(agente);
      expect(lista).toHaveLength(10);
      expect(lista.filter((c) => c.tipo === 'gasto').map((c) => c.nombre).sort()).toEqual(
        CATEGORIAS_PREDETERMINADAS.filter((c) => c.tipo === 'gasto').map((c) => c.nombre).sort(),
      );
      expect(lista.filter((c) => c.tipo === 'ingreso').map((c) => c.nombre).sort()).toEqual([
        'Otros ingresos',
        'Sueldo',
        'Ventas',
      ]);
      const usuario = await usuarios().findOne({ email: u.email });
      expect(await categorias().countDocuments({ tenantId: usuario.tenantId })).toBe(10);
      expect(await categorias().countDocuments({ tenantId: { $exists: false } })).toBe(0);
    });

    it('Edición sin afectar a otros usuarios: renombrar la de A no cambia la de B', async () => {
      const a = await sesion();
      const b = await sesion();
      const deA = porNombre(await listar(a.agente), 'Transporte');
      await a.agente.patch(`/api/v1/categorias/${deA.id}`).send({ nombre: 'Movilidad' });
      expect(porNombre(await listar(a.agente), 'Movilidad')).toBeTruthy();
      expect(porNombre(await listar(b.agente), 'Transporte')).toBeTruthy();
      expect(porNombre(await listar(b.agente), 'Movilidad')).toBeUndefined();
    });

    it('Categoría predeterminada eliminada: al volver a iniciar sesión no reaparece', async () => {
      const { u, agente } = await sesion();
      const ventas = porNombre(await listar(agente), 'Ventas');
      expect((await agente.delete(`/api/v1/categorias/${ventas.id}`)).status).toBe(204);

      const { agente: otraSesion } = await e.iniciarSesion(u);
      const lista = await listar(otraSesion);
      expect(lista).toHaveLength(9);
      expect(porNombre(lista, 'Ventas')).toBeUndefined();
    });

    it('El correo duplicado sigue dando 409 y no deja categorías huérfanas', async () => {
      const u = await e.registrar();
      const antes = await categorias().countDocuments();
      const repetido = await e.registrar({ email: u.email });
      expect(repetido.res.status).toBe(409);
      expect(await categorias().countDocuments()).toBe(antes);
    });
  });
});

describe('HU-24 · falla al crear las categorías iniciales', () => {
  let e;
  beforeAll(async () => {
    let fallar = true;
    e = await iniciarEntorno({
      crearCategoriasIniciales: async (datos, opciones) => {
        const { crearPredeterminadas } = await import('../src/repositories/categoria.repository.js');
        if (fallar) {
          // Inserta algunas y falla: la transacción debe deshacerlas junto con el usuario.
          await crearPredeterminadas(datos, opciones);
          throw new Error('fallo simulado al crear categorías');
        }
        return crearPredeterminadas(datos, opciones);
      },
    });
    e.permitirCategorias = () => {
      fallar = false;
    };
  });
  afterAll(() => e.cerrar());

  it('no queda una cuenta incompleta, el visitante recibe el mensaje y puede reintentar con el mismo correo', async () => {
    const correo = e.correoUnico();
    const fallido = await e.registrar({ email: correo });
    expect(fallido.res.status).toBe(500);
    expect(fallido.res.body.error.message).toBe('No pudimos completar tu registro. Inténtalo nuevamente');
    expect(await mongoose.connection.collection('usuarios').countDocuments({ email: correo })).toBe(0);
    expect(await mongoose.connection.collection('categorias').countDocuments()).toBe(0);
    expect(e.transporte.sendMail).not.toHaveBeenCalled();

    e.permitirCategorias();
    const reintento = await e.registrar({ email: correo });
    expect(reintento.res.status).toBe(201);
    const { agente } = await e.iniciarSesion(reintento);
    expect((await agente.get('/api/v1/categorias?limit=100')).body.data).toHaveLength(10);
  });
});

describe('HU-04 · HU-05 · HU-22 · lectura de categorías por administración', () => {
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
  const deUsuario = (agente, id, consulta = '?limit=100') =>
    agente.get(`/api/v1/admin/usuarios/${id}/categorias${consulta}`);

  it('HU-04 · el administrador consulta las categorías de cualquier usuario', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const luis = await sesion();
    for (const { u } of [ana, luis]) {
      const res = await deUsuario(admin.agente, u.id);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.meta).toMatchObject({ total: 10, page: 1 });
    }
    const gastos = await deUsuario(admin.agente, ana.u.id, '?tipo=gasto&limit=100');
    expect(gastos.body.data).toHaveLength(7);
  });

  it('HU-04 · un usuario estándar recibe 403 en la lectura de administración, incluso de sus propias categorías', async () => {
    const ana = await sesion();
    const luis = await sesion();
    for (const id of [ana.u.id, luis.u.id]) {
      const res = await deUsuario(ana.agente, id);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatchObject({ code: 'FORBIDDEN', message: 'Acceso no autorizado' });
    }
  });

  it('HU-22 · un usuario inexistente o con id inválido responde 404 y uno sin categorías devuelve la lista vacía', async () => {
    const admin = await sesion(ROLES.ADMIN);
    expect((await deUsuario(admin.agente, '65f000000000000000000000')).status).toBe(404);
    expect((await deUsuario(admin.agente, 'no-es-un-id')).status).toBe(404);

    const vacio = await sesion();
    await mongoose.connection.collection('categorias').deleteMany({
      tenantId: (await usuarios().findOne({ email: vacio.u.email })).tenantId,
    });
    const res = await deUsuario(admin.agente, vacio.u.id);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('HU-22 · el administrador no puede modificar categorías ajenas: PATCH y DELETE responden 404 y nada cambia', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const deAna = (await deUsuario(admin.agente, ana.u.id)).body.data;
    const transporte = deAna.find((c) => c.nombre === 'Transporte');

    const editar = await admin.agente.patch(`/api/v1/categorias/${transporte.id}`).send({ nombre: 'Tomada' });
    const borrar = await admin.agente.delete(`/api/v1/categorias/${transporte.id}`);
    const crear = await admin.agente
      .post(`/api/v1/admin/usuarios/${ana.u.id}/categorias`)
      .send({ nombre: 'Impuesta', tipo: 'gasto' });
    expect(editar.status).toBe(404);
    expect(borrar.status).toBe(404);
    expect(crear.status).toBe(404);
    expect(editar.body.error.message).toBe(
      'El recurso solicitado no existe o no tienes permiso para acceder a él',
    );

    const despues = (await deUsuario(admin.agente, ana.u.id)).body.data;
    expect(despues).toEqual(deAna);
  });

  it('HU-05 · el administrador conserva su propio aislamiento: sus categorías no se mezclan con las de otros', async () => {
    const admin = await sesion(ROLES.ADMIN);
    const ana = await sesion();
    const propias = (await admin.agente.get('/api/v1/categorias?limit=100')).body.data;
    const deAna = (await deUsuario(admin.agente, ana.u.id)).body.data;
    expect(propias).toHaveLength(10);
    const idsPropios = new Set(propias.map((c) => c.id));
    expect(deAna.every((c) => !idsPropios.has(c.id))).toBe(true);
  });

  it('HU-05 · un usuario no ve las categorías de otro ni conociendo su id', async () => {
    const ana = await sesion();
    const luis = await sesion();
    const deLuis = (await luis.agente.get('/api/v1/categorias?limit=100')).body.data;
    const deAna = (await ana.agente.get('/api/v1/categorias?limit=100')).body.data;
    const idsAna = new Set(deAna.map((c) => c.id));
    expect(deLuis.every((c) => !idsAna.has(c.id))).toBe(true);
    const ajena = await ana.agente.patch(`/api/v1/categorias/${deLuis[0].id}`).send({ nombre: 'Robada' });
    expect(ajena.status).toBe(404);
  });
});

void CLAVE;
