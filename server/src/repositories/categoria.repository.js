// Único acceso al modelo Categoria. Siempre se construye con el tenantId del usuario autenticado.
import mongoose from 'mongoose';
import { CATEGORIAS_PREDETERMINADAS } from '@finanzas/shared';
import { Categoria } from '../models/categoria.model.js';
import { RepositorioBase } from './base.repository.js';

/** Para la lectura de administrador (admin.repositorioLecturaDe recibe el modelo). */
export const ModeloCategoria = Categoria;

/** Intercalación con la que se ordenan los nombres (sin distinguir tildes ni mayúsculas). */
export const INTERCALACION = { locale: 'es', strength: 1 };

/** Con el orden por tipo se desempata por nombre. */
export const ordenCategorias = (sort) => (sort === 'tipo' || sort === '-tipo' ? `${sort} nombre` : sort);

export class CategoriaRepository extends RepositorioBase {
  constructor(tenantId) {
    super(Categoria, tenantId);
  }

  /** Orden estable y legible: por tipo y, dentro de cada tipo, por nombre (sin distinguir tildes ni mayúsculas). */
  listarOrdenadas(filtro, { page, limit, sort }) {
    return this.listar(filtro, { page, limit, sort: ordenCategorias(sort), collation: INTERCALACION });
  }

  /**
   * Movimientos de este inquilino que usan la categoría. Lee la colección `movimientos` (mismos campos que fija el
   * diseño base); `implementar-movimientos` lo reemplaza por su repositorio sin cambiar la regla.
   */
  async contarMovimientos(categoriaId, { session } = {}) {
    return mongoose.connection
      .collection('movimientos')
      .countDocuments(
        { tenantId: this.tenantId, categoriaId: new mongoose.Types.ObjectId(categoriaId) },
        { session },
      );
  }
}

export const categoriaRepository = (tenantId) => new CategoriaRepository(tenantId);

/** Crea las categorías predeterminadas propias de un usuario nuevo (HU-24), dentro de la transacción recibida. */
export async function crearPredeterminadas({ tenantId, usuarioId }, { session }) {
  return Categoria.insertMany(
    CATEGORIAS_PREDETERMINADAS.map((c) => ({ ...c, tenantId, usuarioId })),
    { session },
  );
}
