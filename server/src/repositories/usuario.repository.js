// Único acceso al modelo Usuario. No filtra por tenantId porque se usa para autenticar (ver el diseño).
import mongoose from 'mongoose';
import { Usuario } from '../models/usuario.model.js';

const valido = (id) => mongoose.isValidObjectId(id);

export const usuarioRepository = {
  async crear(datos) {
    const [usuario] = await Usuario.create([datos]);
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

  /** Guarda la nueva contraseña y levanta cualquier bloqueo por intentos. */
  async actualizarPassword(id, passwordHash) {
    await Usuario.updateOne(
      { _id: id },
      { $set: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null } },
    );
  },
};
