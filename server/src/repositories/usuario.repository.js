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
   * Suma un intento fallido de forma atómica (sin leer y escribir) y bloquea al llegar al máximo.
   * Si un bloqueo anterior ya venció, el conteo vuelve a empezar en 1.
   */
  async registrarFallo(id, { maximo, bloqueoHasta, ahora }) {
    const bloqueoVencido = {
      $and: [{ $ne: ['$bloqueadoHasta', null] }, { $lte: ['$bloqueadoHasta', ahora] }],
    };
    return Usuario.findByIdAndUpdate(
      id,
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
      { new: true, updatePipeline: true },
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
