// Único acceso al modelo Usuario. No filtra por tenantId porque se usa para autenticar (ver el diseño).
import mongoose from 'mongoose';
import { ROLES } from '@finanzas/shared';
import { Bloqueo } from '../models/bloqueo.model.js';
import { Usuario } from '../models/usuario.model.js';

const valido = (id) => mongoose.isValidObjectId(id);

export const usuarioRepository = {
  async crear(datos, { session } = {}) {
    const [usuario] = await Usuario.create([datos], { session });
    return usuario.toObject();
  },

  async buscarPorEmail(email) {
    return Usuario.findOne({ email: String(email).toLowerCase() }).lean();
  },

  async buscarPorId(id) {
    return valido(id) ? Usuario.findById(id).lean() : null;
  },

  /**
   * Reserva un intento de inicio de sesión de forma atómica ANTES de comprobar la contraseña: así los intentos
   * simultáneos no pueden burlar el límite. Bloquea al llegar al máximo y devuelve null si ya hay un bloqueo
   * vigente. Un inicio correcto lo devuelve a cero con reiniciarIntentos.
   * Si un bloqueo anterior ya venció, el conteo vuelve a empezar en 1.
   */
  async reservarIntento(id, { maximo, bloqueoHasta, ahora }) {
    const bloqueoVencido = {
      $and: [{ $ne: ['$bloqueadoHasta', null] }, { $lte: ['$bloqueadoHasta', ahora] }],
    };
    if (!valido(id)) return null;
    return Usuario.findOneAndUpdate(
      { _id: id, $or: [{ bloqueadoHasta: null }, { bloqueadoHasta: { $lte: ahora } }] },
      [
        {
          $set: {
            intentosFallidos: { $cond: [bloqueoVencido, 1, { $add: ['$intentosFallidos', 1] }] },
          },
        },
        {
          $set: {
            bloqueadoHasta: { $cond: [{ $gte: ['$intentosFallidos', maximo] }, bloqueoHasta, null] },
          },
        },
      ],
      { returnDocument: 'after', updatePipeline: true },
    ).lean();
  },

  async reiniciarIntentos(id) {
    await Usuario.updateOne({ _id: id }, { $set: { intentosFallidos: 0, bloqueadoHasta: null } });
  },

  /** Actualiza solo los datos editables del perfil; el correo, el rol y el tenant no se tocan nunca. */
  async actualizarPerfil(id, { nombre, monedaPrincipal }) {
    const cambios = { nombre, ...(monedaPrincipal && { monedaPrincipal }) };
    return Usuario.findByIdAndUpdate(id, { $set: cambios }, { returnDocument: 'after' }).lean();
  },

  /** Guarda las preferencias de idioma y accesibilidad recibidas (HU-32, HU-33). */
  async actualizarPreferencias(id, preferencias) {
    return Usuario.findByIdAndUpdate(id, { $set: preferencias }, { returnDocument: 'after' }).lean();
  },

  /** Guarda la nueva contraseña y levanta cualquier bloqueo por intentos. */
  async actualizarPassword(id, passwordHash) {
    await Usuario.updateOne(
      { _id: id },
      { $set: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null } },
    );
  },

  /** Listado para administración: búsqueda por nombre o correo (texto literal), paginado y ordenado. */
  async listarParaAdmin({ q, page, limit, sort }) {
    const filtro = {};
    if (q) {
      const texto = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtro.$or = [{ nombre: texto }, { email: texto }];
    }
    const [items, total] = await Promise.all([
      Usuario.find(filtro)
        .sort(`${sort} _id`)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Usuario.countDocuments(filtro),
    ]);
    return { items, total };
  },

  /**
   * Cambia el rol dentro de una transacción que primero escribe un documento centinela: dos cambios
   * simultáneos chocan y se serializan, así nunca se degrada al último administrador.
   * @returns {Promise<{ estado: 'ok' | 'sin_cambios' | 'no_existe' | 'ultimo_administrador', usuario?: object }>}
   */
  async cambiarRolGarantizandoAdministrador(id, rol) {
    if (!valido(id)) return { estado: 'no_existe' };
    const sesion = await mongoose.startSession();
    try {
      let resultado;
      await sesion.withTransaction(async () => {
        await Bloqueo.updateOne(
          { _id: 'roles' },
          { $inc: { version: 1 } },
          { upsert: true, session: sesion },
        );
        const usuario = await Usuario.findById(id).session(sesion);
        if (!usuario) {
          resultado = { estado: 'no_existe' };
          return;
        }
        if (usuario.rol === rol) {
          resultado = { estado: 'sin_cambios', usuario: usuario.toObject() };
          return;
        }
        if (rol !== ROLES.ADMIN) {
          const otros = await Usuario.countDocuments({
            rol: ROLES.ADMIN,
            activo: true,
            _id: { $ne: id },
          }).session(sesion);
          if (otros === 0) {
            resultado = { estado: 'ultimo_administrador' };
            return;
          }
        }
        usuario.rol = rol;
        await usuario.save({ session: sesion });
        resultado = { estado: 'ok', usuario: usuario.toObject() };
      });
      return resultado;
    } finally {
      await sesion.endSession();
    }
  },
};
