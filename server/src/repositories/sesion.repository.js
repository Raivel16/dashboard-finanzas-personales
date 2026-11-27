// Único acceso al modelo Sesion.
import { esIdentificador } from '../models/plugins/identificador.js';
import { Sesion } from '../models/sesion.model.js';

const valido = esIdentificador;

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
      { returnDocument: 'after' },
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

  /** Revoca todas las sesiones del usuario salvo la indicada (la desde la que cambió su contraseña). */
  async revocarOtras(usuarioId, sesionId, ahora) {
    await Sesion.updateMany(
      { usuarioId, _id: { $ne: sesionId }, revocadaEn: null },
      { $set: { revocadaEn: ahora } },
    );
  },

  async revocarTodasDeUsuario(usuarioId, ahora) {
    await Sesion.updateMany({ usuarioId, revocadaEn: null }, { $set: { revocadaEn: ahora } });
  },
};
