// Token de un solo uso para restablecer la contraseña. Solo se guarda su hash.
import mongoose from 'mongoose';
import { ID_UUID, REFERENCIA_UUID } from './plugins/identificador.js';

const esquema = new mongoose.Schema(
  {
    ...ID_UUID,
    usuarioId: { ...REFERENCIA_UUID, ref: 'Usuario', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    // Fechas tomadas del reloj inyectado (no de timestamps) para poder probar los 30 minutos.
    creadoEn: { type: Date, required: true },
    expiraEn: { type: Date, required: true },
    usadoEn: { type: Date, default: null },
  },
  { collection: 'tokensrecuperacion' },
);
esquema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

export const TokenRecuperacion =
  mongoose.models.TokenRecuperacion ?? mongoose.model('TokenRecuperacion', esquema);
