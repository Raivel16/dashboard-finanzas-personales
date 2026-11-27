// Presupuesto mensual (HU-14, HU-29, HU-30). Es de un inquilino. `categoriaId` nulo es el presupuesto general
// del mes y la moneda; con valor, el sub-presupuesto de esa categoría de gasto.
import mongoose from 'mongoose';
import { ID_UUID, REFERENCIA_UUID } from './plugins/identificador.js';
import { MONEDAS } from '@finanzas/shared';
import { tenantPlugin } from './plugins/tenant.plugin.js';

const esquema = new mongoose.Schema(
  {
    ...ID_UUID,
    periodo: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    moneda: { type: String, enum: MONEDAS, required: true },
    // Se guarda `null` explícito para que el índice único también proteja al presupuesto general.
    categoriaId: { ...REFERENCIA_UUID, default: null },
    monto: { type: mongoose.Schema.Types.Decimal128, required: true },
  },
  { timestamps: true, collection: 'presupuestos' },
);

esquema.plugin(tenantPlugin);
esquema.index({ tenantId: 1, periodo: 1, moneda: 1, categoriaId: 1 }, { unique: true });

export const Presupuesto = mongoose.models.Presupuesto ?? mongoose.model('Presupuesto', esquema);
