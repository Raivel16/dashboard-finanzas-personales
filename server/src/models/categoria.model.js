// Categoría de ingresos o gastos (HU-06). Es de un inquilino: nunca existen categorías globales (HU-24).
import mongoose from 'mongoose';
import { ID_UUID } from './plugins/identificador.js';
import { ICONO_CATEGORIA_POR_DEFECTO, TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { tenantPlugin } from './plugins/tenant.plugin.js';

const esquema = new mongoose.Schema(
  {
    ...ID_UUID,
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, enum: Object.values(TIPOS_MOVIMIENTO), required: true },
    icono: { type: String, default: ICONO_CATEGORIA_POR_DEFECTO },
  },
  { timestamps: true, collection: 'categorias' },
);

esquema.plugin(tenantPlugin);
// La unicidad la decide la base de datos: dos creaciones simultáneas no pueden ganar ambas.
// Intercalación de fuerza 1: "Educación", "educación" y "EDUCACION" son el mismo nombre.
esquema.index(
  { tenantId: 1, tipo: 1, nombre: 1 },
  { unique: true, collation: { locale: 'es', strength: 1 } },
);

export const Categoria = mongoose.models.Categoria ?? mongoose.model('Categoria', esquema);
