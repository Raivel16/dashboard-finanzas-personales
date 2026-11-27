// Cuenta o medio de pago (HU-07, HU-25). Es de un inquilino. Los importes son Decimal128: nunca Number.
import mongoose from 'mongoose';
import { ID_UUID } from './plugins/identificador.js';
import { MONEDAS, TIPOS_CUENTA } from '@finanzas/shared';
import { tenantPlugin } from './plugins/tenant.plugin.js';

const esquema = new mongoose.Schema(
  {
    ...ID_UUID,
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, enum: Object.values(TIPOS_CUENTA), required: true },
    moneda: { type: String, enum: MONEDAS, required: true },
    saldoInicial: { type: mongoose.Schema.Types.Decimal128, required: true },
    saldoActual: { type: mongoose.Schema.Types.Decimal128, required: true },
  },
  { timestamps: true, collection: 'cuentas' },
);

esquema.plugin(tenantPlugin);
// La unicidad la decide la base de datos: dos creaciones simultáneas no pueden ganar ambas.
// Intercalación de fuerza 1: "Visa", "visa" y "VÍSA" son el mismo nombre.
esquema.index({ tenantId: 1, nombre: 1 }, { unique: true, collation: { locale: 'es', strength: 1 } });

export const Cuenta = mongoose.models.Cuenta ?? mongoose.model('Cuenta', esquema);
