// Repositorio base de datos de un inquilino. Es el único código que toca los modelos y
// SIEMPRE agrega el tenantId del usuario autenticado: no existen métodos sin ese filtro.
import mongoose from 'mongoose';

export class RepositorioBase {
  constructor(modelo, tenantId) {
    if (typeof tenantId !== 'string' || tenantId.length === 0) {
      throw new Error(`El repositorio de ${modelo?.modelName ?? 'datos'} requiere un tenantId`);
    }
    this.modelo = modelo;
    this.tenantId = tenantId;
  }

  /** El tenantId de la instancia siempre prevalece sobre cualquier valor del filtro recibido. */
  _filtro(filtro = {}) {
    return { ...filtro, tenantId: this.tenantId };
  }

  async encontrarPorId(id, { session } = {}) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.modelo.findOne(this._filtro({ _id: id })).session(session ?? null);
  }

  async listar(filtro = {}, { page = 1, limit = 20, sort = '-createdAt', session } = {}) {
    const consulta = this._filtro(filtro);
    const [items, total] = await Promise.all([
      this.modelo
        .find(consulta)
        .sort(`${sort} _id`)
        .skip((page - 1) * limit)
        .limit(limit)
        .session(session ?? null),
      this.modelo.countDocuments(consulta).session(session ?? null),
    ]);
    return { items, total };
  }

  async contar(filtro = {}, { session } = {}) {
    return this.modelo.countDocuments(this._filtro(filtro)).session(session ?? null);
  }

  async crear(datos, { session } = {}) {
    const [documento] = await this.modelo.create([{ ...datos, tenantId: this.tenantId }], { session });
    return documento;
  }

  async actualizarPorId(id, cambios, { session } = {}) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.modelo.findOneAndUpdate(this._filtro({ _id: id }), cambios, {
      returnDocument: 'after',
      runValidators: true,
      session,
    });
  }

  async eliminarPorId(id, { session } = {}) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.modelo.findOneAndDelete(this._filtro({ _id: id }), { session });
  }

  /** Agregaciones: el $match por tenantId se antepone siempre. */
  async agregar(etapas, { session } = {}) {
    return this.modelo
      .aggregate([{ $match: { tenantId: this.tenantId } }, ...etapas])
      .session(session ?? null);
  }
}
