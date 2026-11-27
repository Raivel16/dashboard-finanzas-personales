// Identidad del usuario. No usa el plugin de tenantId: se consulta por correo o id antes de que exista
// un inquilino autenticado (el tenantId se guarda aquí y viaja en el token de acceso).
import mongoose from 'mongoose';
import { IDIOMAS, MONEDAS, ROLES } from '@finanzas/shared';

const esquema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true },
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: Object.values(ROLES), default: ROLES.USUARIO },
    monedaPrincipal: { type: String, enum: MONEDAS, default: 'PEN' },
    // Preferencias de idioma y accesibilidad (HU-32, HU-33).
    idioma: { type: String, enum: Object.values(IDIOMAS), default: IDIOMAS.ES },
    textoGrande: { type: Boolean, default: false },
    altoContraste: { type: Boolean, default: false },
    intentosFallidos: { type: Number, default: 0 },
    bloqueadoHasta: { type: Date, default: null },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'usuarios' },
);

export const Usuario = mongoose.models.Usuario ?? mongoose.model('Usuario', esquema);
