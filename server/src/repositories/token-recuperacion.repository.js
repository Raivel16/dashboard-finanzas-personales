// Único acceso al modelo TokenRecuperacion.
import { TokenRecuperacion } from '../models/token-recuperacion.model.js';

export const tokenRecuperacionRepository = {
  async crear(datos) {
    const [token] = await TokenRecuperacion.create([datos]);
    return token.toObject();
  },

  async buscarPorHash(hash) {
    return TokenRecuperacion.findOne({ tokenHash: hash }).lean();
  },

  /** Token vigente creado desde `desde`: sirve para no emitir otro enlace demasiado pronto. */
  async buscarVigenteReciente(usuarioId, { desde, ahora }) {
    return TokenRecuperacion.findOne({
      usuarioId,
      usadoEn: null,
      expiraEn: { $gt: ahora },
      creadoEn: { $gte: desde },
    }).lean();
  },

  /** Marca el token como usado una sola vez; devuelve null si otra solicitud ya lo usó. */
  async marcarUsado(id, ahora) {
    return TokenRecuperacion.findOneAndUpdate(
      { _id: id, usadoEn: null },
      { $set: { usadoEn: ahora } },
      { returnDocument: 'after' },
    ).lean();
  },

  /** Invalida los enlaces pendientes de un usuario (al pedir uno nuevo o al restablecer). */
  async invalidarPendientes(usuarioId, ahora) {
    await TokenRecuperacion.updateMany({ usuarioId, usadoEn: null }, { $set: { usadoEn: ahora } });
  },
};
