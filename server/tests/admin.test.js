// HU-04 · control de acceso por rol, HU-22 · usuarios en solo lectura y HU-23 · gestión de roles.
// Los datos financieros aún no existen: el acceso ajeno de solo lectura se prueba con un recurso de prueba.
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { ROLES } from '@finanzas/shared';
import { tenantPlugin } from '../src/models/plugins/tenant.plugin.js';
import { RepositorioBase } from '../src/repositories/base.repository.js';
import { crearAutorizacion } from '../src/services/autorizacion.service.js';
import { iniciarEntorno } from './helpers/api.js';

const esquemaPrueba = new mongoose.Schema({ nombre: String }, { timestamps: true });
esquemaPrueba.plugin(tenantPlugin);
const Recurso = mongoose.models.RecursoPrueba ?? mongoose.model('RecursoPrueba', esquemaPrueba);

/** Rutas de un recurso de prueba que imitan las de cualquier recurso de datos del sistema. */
function rutasDePrueba(api, { autenticar, admin }) {
  const propio = (req) => new RepositorioBase(Recurso, req.usuario.tenantId);
  api.post('/recursos-prueba', autenticar, async (req, res) => {
    const creado = await propio(req).crear({ nombre: req.body.nombre, usuarioId: req.usuario.id });
    res.status(201).json({ data: { id: String(creado._id), nombre: creado.nombre } });
  });
  api.put('/recursos-prueba/:id', autenticar, async (req, res) => {
    const cambiado = await propio(req).actualizarPorId(req.params.id, { nombre: req.body.nombre });
    if (!cambiado) {
      return res
        .status(404)
        .json({
          error: {
            code: 'NOT_FOUND',
            message: 'El recurso solicitado no existe o no tienes permiso para acceder a él',
          },
        });
    }
    return res.json({ data: { id: String(cambiado._id), nombre: cambiado.nombre } });
  });
  api.get('/admin/usuarios/:id/recursos-prueba', autenticar, async (req, res) => {
    const repo = await admin.repositorioLecturaDe(req.usuario, Recurso, req.params.id);
    const { items, total } = await repo.listar();
    res.json({ data: items.map((i) => ({ id: String(i._id), nombre: i.nombre })), meta: { total } });
  });
}

describe('control de acceso y administración', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno({ extras: rutasDePrueba });
  });
  afterAll(() => e.cerrar());

  const usuarios = () => mongoose.connection.collection('usuarios');
  const fijarRol = (id, rol) =>
    usuarios().updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { rol } });
  const dejarSoloAdmin = (id) =>
    usuarios().updateMany(
      { rol: ROLES.ADMIN, _id: { $ne: new mongoose.Types.ObjectId(id) } },
      { $set: { rol: ROLES.USUARIO } },
    );

  async function sesion(rol = ROLES.USUARIO, extra = {}) {
    const u = await e.registrar(extra);
    if (rol !== ROLES.USUARIO) await fijarRol(u.id, rol);
    const { agente } = await e.iniciarSesion(u);
    return { u, agente };
  }
  const rol = (agente, id, valor) => agente.patch(`/api/v1/admin/usuarios/${id}/rol`).send({ rol: valor });

  describe('HU-04 · autorización por rol', () => {
    it('Restricción para usuario estándar: 403 "Acceso no autorizado" en cualquier ruta de administración', async () => {
      const { agente } = await sesion();
      for (const [metodo, ruta] of [
        ['get', '/api/v1/admin/usuarios'],
        ['get', '/api/v1/admin/usuarios/65f000000000000000000000'],
        ['patch', '/api/v1/admin/usuarios/65f000000000000000000000/rol'],
      ]) {
        const res = await agente[metodo](ruta).send({ rol: 'admin' });
        expect(res.status).toBe(403);
        expect(res.body.error).toMatchObject({ code: 'FORBIDDEN', message: 'Acceso no autorizado' });
      }
    });

    it('sin sesión la administración responde 401', async () => {
      expect((await request(e.app).get('/api/v1/admin/usuarios')).status).toBe(401);
    });

    it('Operación rechazada por falta de permisos: el servicio la rechaza y registra el intento', async () => {
      const objetivo = await e.registrar();
      const { u, agente } = await sesion();
      expect((await rol(agente, objetivo.id, 'admin')).status).toBe(403);
      expect((await usuarios().findOne({ email: objetivo.email })).rol).toBe('usuario');

      const logger = { warn: jest.fn() };
      const autorizacion = crearAutorizacion({ logger });
      expect(() =>
        autorizacion.exigirAdmin({ id: u.id, rol: 'usuario' }, { accion: 'cambiar rol', ruta: '/x' }),
      ).toThrow('Acceso no autorizado');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: u.id, rol: 'usuario', accion: 'cambiar rol' }),
        'acceso no autorizado',
      );
      // El servicio de administración también exige el rol por sí mismo, sin pasar por las rutas.
      const { admin } = e.app.locals.servicios;
      await expect(
        admin.cambiarRol({ id: u.id, rol: 'usuario' }, objetivo.id, 'admin'),
      ).rejects.toMatchObject({
        estado: 403,
      });
    });

    it('Administración autorizada: un administrador entra', async () => {
      const { agente } = await sesion(ROLES.ADMIN);
      expect((await agente.get('/api/v1/admin/usuarios')).status).toBe(200);
    });

    it('Degradación durante la sesión: se deniega en la siguiente solicitud con el mismo token', async () => {
      const { u, agente } = await sesion(ROLES.ADMIN);
      expect((await agente.get('/api/v1/admin/usuarios')).status).toBe(200);
      await fijarRol(u.id, ROLES.USUARIO);
      expect((await agente.get('/api/v1/admin/usuarios')).status).toBe(403);
    });

    it('un usuario promovido obtiene acceso en su siguiente acción', async () => {
      const { u, agente } = await sesion();
      expect((await agente.get('/api/v1/admin/usuarios')).status).toBe(403);
      await fijarRol(u.id, ROLES.ADMIN);
      expect((await agente.get('/api/v1/admin/usuarios')).status).toBe(200);
    });
  });

  describe('HU-22 · usuarios en solo lectura', () => {
    it('Búsqueda de usuarios: filtra por nombre o correo, pagina y no expone datos sensibles', async () => {
      const { agente } = await sesion(ROLES.ADMIN);
      const marca = `Zeta${Date.now()}`;
      for (let i = 0; i < 3; i += 1) await e.registrar({ nombre: `${marca} ${i}` });

      const res = await agente.get('/api/v1/admin/usuarios').query({ q: marca.toLowerCase(), limit: 2 });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|intentosFallidos|bloqueadoHasta|tenantId/);
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          nombre: expect.any(String),
          email: expect.any(String),
          rol: 'usuario',
          activo: true,
        }),
      );

      const segunda = await agente.get('/api/v1/admin/usuarios').query({ q: marca, limit: 2, page: 2 });
      expect(segunda.body.data).toHaveLength(1);

      const porCorreo = await agente.get('/api/v1/admin/usuarios').query({ q: 'persona' });
      expect(porCorreo.body.meta.total).toBeGreaterThan(0);
    });

    it('la búsqueda es literal: los caracteres de expresión regular no coinciden con todo', async () => {
      const { agente } = await sesion(ROLES.ADMIN);
      const res = await agente.get('/api/v1/admin/usuarios').query({ q: '.*' });
      expect(res.body.meta.total).toBe(0);
    });

    it('valida la consulta y consulta un usuario por id', async () => {
      const { agente } = await sesion(ROLES.ADMIN);
      expect((await agente.get('/api/v1/admin/usuarios').query({ limit: 9999 })).status).toBe(400);
      expect((await agente.get('/api/v1/admin/usuarios').query({ sort: 'passwordHash' })).status).toBe(400);

      const otro = await e.registrar();
      const res = await agente.get(`/api/v1/admin/usuarios/${otro.id}`);
      expect(res.body.data).toMatchObject({ id: otro.id, email: otro.email, rol: 'usuario' });
      expect((await agente.get('/api/v1/admin/usuarios/no-es-un-id')).status).toBe(404);
      expect((await agente.get('/api/v1/admin/usuarios/65f000000000000000000000')).status).toBe(404);
    });

    it('Modificación de datos ajenos rechazada: el administrador lee, pero no puede editar lo de otra persona', async () => {
      const dueno = await sesion();
      const creado = await dueno.agente.post('/api/v1/recursos-prueba').send({ nombre: 'Del dueño' });
      const admin = await sesion(ROLES.ADMIN);

      const lectura = await admin.agente.get(`/api/v1/admin/usuarios/${dueno.u.id}/recursos-prueba`);
      expect(lectura.status).toBe(200);
      expect(lectura.body.data.map((r) => r.nombre)).toEqual(['Del dueño']);

      const edicion = await admin.agente
        .put(`/api/v1/recursos-prueba/${creado.body.data.id}`)
        .send({ nombre: 'Hackeado' });
      expect(edicion.status).toBe(404);
      expect(edicion.body.error.message).toBe(
        'El recurso solicitado no existe o no tienes permiso para acceder a él',
      );
      const intacto = await dueno.agente.get(`/api/v1/admin/usuarios/${dueno.u.id}/recursos-prueba`);
      expect(intacto.status).toBe(403); // el dueño tampoco entra a la lectura de administración
      const final = await admin.agente.get(`/api/v1/admin/usuarios/${dueno.u.id}/recursos-prueba`);
      expect(final.body.data[0].nombre).toBe('Del dueño');
    });

    it('un usuario estándar no accede a la lectura de datos ajenos y un usuario sin datos devuelve una lista vacía', async () => {
      const vacio = await sesion();
      const admin = await sesion(ROLES.ADMIN);
      const res = await admin.agente.get(`/api/v1/admin/usuarios/${vacio.u.id}/recursos-prueba`);
      expect(res.body).toEqual({ data: [], meta: { total: 0 } });
      expect((await vacio.agente.get(`/api/v1/admin/usuarios/${vacio.u.id}/recursos-prueba`)).status).toBe(
        403,
      );
    });

    it('el repositorio de lectura no tiene métodos de escritura', async () => {
      const { admin } = e.app.locals.servicios;
      const u = await e.registrar();
      const repo = await admin.repositorioLecturaDe({ id: 'x', rol: 'admin' }, Recurso, u.id);
      for (const metodo of ['crear', 'actualizarPorId', 'eliminarPorId'])
        expect(repo[metodo]).toBeUndefined();
    });
  });

  describe('HU-23 · gestión de roles', () => {
    it('Promoción: el usuario pasa a administrador y obtiene acceso en su siguiente acción', async () => {
      const admin = await sesion(ROLES.ADMIN);
      const ana = await sesion();
      const res = await rol(admin.agente, ana.u.id, 'admin');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: ana.u.id, rol: 'admin' });
      expect((await ana.agente.get('/api/v1/admin/usuarios')).status).toBe(200);
    });

    it('Degradación de otro administrador: el degradado pierde el acceso de inmediato', async () => {
      const a = await sesion(ROLES.ADMIN);
      const b = await sesion(ROLES.ADMIN);
      expect((await rol(a.agente, b.u.id, 'usuario')).status).toBe(200);
      expect((await b.agente.get('/api/v1/admin/usuarios')).status).toBe(403);
    });

    it('un administrador puede degradarse a sí mismo si hay otro', async () => {
      const a = await sesion(ROLES.ADMIN);
      await sesion(ROLES.ADMIN);
      expect((await rol(a.agente, a.u.id, 'usuario')).status).toBe(200);
    });

    it('Degradación del último administrador rechazada: 409 con el mensaje exacto y sin cambios', async () => {
      const unico = await sesion(ROLES.ADMIN);
      await dejarSoloAdmin(unico.u.id);
      const res = await rol(unico.agente, unico.u.id, 'usuario');
      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('Debe existir al menos un administrador');
      expect((await usuarios().findOne({ email: unico.u.email })).rol).toBe('admin');
      expect((await unico.agente.get('/api/v1/admin/usuarios')).status).toBe(200);
    });

    it('dos administradores que se degradan a la vez no dejan al sistema sin administradores', async () => {
      const a = await sesion(ROLES.ADMIN);
      const b = await sesion(ROLES.ADMIN);
      await usuarios().updateMany(
        { rol: ROLES.ADMIN, _id: { $nin: [a.u.id, b.u.id].map((i) => new mongoose.Types.ObjectId(i)) } },
        { $set: { rol: ROLES.USUARIO } },
      );

      const [r1, r2] = await Promise.all([
        rol(a.agente, b.u.id, 'usuario'),
        rol(b.agente, a.u.id, 'usuario'),
      ]);
      expect([r1.status, r2.status].filter((s) => s === 200)).toHaveLength(1);
      expect(await usuarios().countDocuments({ rol: ROLES.ADMIN })).toBe(1);
    });

    it('valida el rol y el usuario, y repetir el mismo rol no cambia nada', async () => {
      const admin = await sesion(ROLES.ADMIN);
      const otro = await e.registrar();
      expect((await rol(admin.agente, otro.id, 'root')).status).toBe(400);
      expect((await rol(admin.agente, 'no-es-un-id', 'admin')).status).toBe(404);
      expect((await rol(admin.agente, '65f000000000000000000000', 'admin')).status).toBe(404);
      const igual = await rol(admin.agente, otro.id, 'usuario');
      expect(igual.status).toBe(200);
      expect(igual.body.data.rol).toBe('usuario');
    });
  });
});
