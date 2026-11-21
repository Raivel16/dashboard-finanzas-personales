// Único acceso al modelo Sesion.
import mongoose from 'mongoose';
import { Sesion } from '../models/sesion.model.js';

const valido = (id) => mongoose.isValidObjectId(id);

export const sesionRepository = {
  async crear(datos) {
    const [sesion] = await Sesion.create([datos]);
    return sesion.toObject();
  },

  async buscarPorId(id) {
    return valido(id) ? Sesion.findById(id).lean() : null;
  },

  /** Busca por el token vigente o por el inmediatamente anterior (ventana de gracia). */
  async buscarPorTokenHash(hash) {
    return Sesion.findOne({ $or: [{ tokenHash: hash }, { tokenHashAnterior: hash }] }).lean();
  },

  /**
   * Rota el token solo si la sesión sigue con el token esperado y no está revocada. Devuelve null si otra
   * solicitud ya lo rotó primero (así dos renovaciones simultáneas no pueden ganar ambas).
   */
  async rotar(id, { tokenHashActual, tokenHashNuevo, ahora, expiraInactividad }) {
    return Sesion.findOneAndUpdate(
      { _id: id, tokenHash: tokenHashActual, revocadaEn: null },
      {
        $set: {
          tokenHash: tokenHashNuevo,
          tokenHashAnterior: tokenHashActual,
          rotadoEn: ahora,
          ultimaActividad: ahora,
          expiraInactividad,
        },
      },
      { new: true },
    ).lean();
  },

  async extenderActividad(id, { ahora, expiraInactividad }) {
    await Sesion.updateOne(
      { _id: id, revocadaEn: null },
      { $set: { ultimaActividad: ahora, expiraInactividad } },
    );
  },

  async revocar(id, ahora) {
    await Sesion.updateOne({ _id: id, revocadaEn: null }, { $set: { revocadaEn: ahora } });
  },

  async revocarTodasDeUsuario(usuarioId, ahora) {
    await Sesion.updateMany({ usuarioId, revocadaEn: null }, { $set: { revocadaEn: ahora } });
  },
};
