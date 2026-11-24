// Único acceso al modelo Cuenta. Siempre se construye con el tenantId del usuario autenticado.
import mongoose from 'mongoose';
import { Cuenta } from '../models/cuenta.model.js';
import { RepositorioBase } from './base.repository.js';

/** Para la lectura de administrador (admin.repositorioLecturaDe recibe el modelo). */
export const ModeloCuenta = Cuenta;

/** Intercalación con la que se ordenan los nombres (sin distinguir tildes ni mayúsculas). */
export const INTERCALACION = { locale: 'es', strength: 1 };

export class CuentaRepository extends RepositorioBase {
  constructor(tenantId) {
    super(Cuenta, tenantId);
  }

  listarOrdenadas(filtro, { page, limit, sort }) {
    return this.listar(filtro, { page, limit, sort, collation: INTERCALACION });
  }

  /**
   * Movimientos de este inquilino que usan la cuenta. Lee la colección `movimientos` (mismos campos que fija el
   * diseño base); `implementar-movimientos` lo reemplaza por su repositorio sin cambiar la regla.
   */
  async contarMovimientos(cuentaId, { session } = {}) {
    return mongoose.connection
      .collection('movimientos')
      .countDocuments(
        { tenantId: this.tenantId, cuentaId: new mongoose.Types.ObjectId(cuentaId) },
        { session },
      );
  }
}

export const cuentaRepository = (tenantId) => new CuentaRepository(tenantId);
