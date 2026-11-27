// Movimiento financiero (HU-08, HU-09). Es de un inquilino. El monto es Decimal128 y siempre positivo:
// el tipo (ingreso o gasto) da el signo. La fecha es un día calendario (00:00 UTC) y la moneda se copia de la cuenta.
import mongoose from 'mongoose';
import { ID_UUID, REFERENCIA_UUID } from './plugins/identificador.js';
import { LIMITES, MONEDAS, TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { tenantPlugin } from './plugins/tenant.plugin.js';

const esquema = new mongoose.Schema(
  {
    ...ID_UUID,
    tipo: { type: String, enum: Object.values(TIPOS_MOVIMIENTO), required: true },
    monto: { type: mongoose.Schema.Types.Decimal128, required: true },
    moneda: { type: String, enum: MONEDAS, required: true },
    fecha: { type: Date, required: true },
    categoriaId: { ...REFERENCIA_UUID, required: true },
    cuentaId: { ...REFERENCIA_UUID, required: true },
    descripcion: { type: String, default: '', trim: true, maxlength: LIMITES.DESCRIPCION_MAX },
  },
  { timestamps: true, collection: 'movimientos' },
);

esquema.plugin(tenantPlugin);
esquema.index({ tenantId: 1, fecha: -1 });
esquema.index({ tenantId: 1, cuentaId: 1 });
esquema.index({ tenantId: 1, categoriaId: 1 });

export const Movimiento = mongoose.models.Movimiento ?? mongoose.model('Movimiento', esquema);
