// Documentos centinela para serializar operaciones que deben ser exclusivas (p. ej. cambios de rol).
// Dos transacciones que escriben el mismo documento chocan y una se reintenta.
import mongoose from 'mongoose';

const esquema = new mongoose.Schema(
  { _id: { type: String }, version: { type: Number, default: 0 } },
  { collection: 'bloqueos' },
);

export const Bloqueo = mongoose.models.Bloqueo ?? mongoose.model('Bloqueo', esquema);
