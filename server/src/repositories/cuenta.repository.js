// Único acceso al modelo Cuenta. Siempre se construye con el tenantId del usuario autenticado.
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
}

export const cuentaRepository = (tenantId) => new CuentaRepository(tenantId);
