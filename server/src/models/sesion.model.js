// Sesión de un dispositivo. Guarda solo el hash del token de renovación, nunca su valor.
import mongoose from 'mongoose';
import { ID_UUID, REFERENCIA_UUID } from './plugins/identificador.js';

const esquema = new mongoose.Schema(
  {
    ...ID_UUID,
    usuarioId: { ...REFERENCIA_UUID, ref: 'Usuario', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    // Token anterior a la última rotación: se acepta durante una ventana de gracia breve.
    tokenHashAnterior: { type: String, default: null, index: true, sparse: true },
    rotadoEn: { type: Date, default: null },
    ultimaActividad: { type: Date, required: true },
    expiraInactividad: { type: Date, required: true },
    expiraAbsoluta: { type: Date, required: true },
    revocadaEn: { type: Date, default: null },
  },
  { timestamps: true, collection: 'sesiones' },
);
// MongoDB elimina la sesión cuando llega su tope absoluto.
esquema.index({ expiraAbsoluta: 1 }, { expireAfterSeconds: 0 });

export const Sesion = mongoose.models.Sesion ?? mongoose.model('Sesion', esquema);
