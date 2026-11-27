// Único acceso al modelo Presupuesto. Siempre se construye con el tenantId del usuario autenticado.
import mongoose from 'mongoose';
import { Presupuesto } from '../models/presupuesto.model.js';
import { RepositorioBase } from './base.repository.js';

/** Para la lectura de administrador (admin.repositorioLecturaDe recibe el modelo). */
export const ModeloPresupuesto = Presupuesto;

// Las referencias se guardan como el UUID en texto (RT-08).
const id = (valor) => (valor ? String(valor) : null);
const CERO = () => mongoose.Types.Decimal128.fromString('0');

export class PresupuestoRepository extends RepositorioBase {
  constructor(tenantId) {
    super(Presupuesto, tenantId);
  }

  /** El presupuesto de una clave (mes, moneda y categoría; `null` = general), o null. */
  buscarPorClave({ periodo, moneda, categoriaId = null }, { session } = {}) {
    return this.modelo
      .findOne(this._filtro({ periodo, moneda, categoriaId: id(categoriaId) }))
      .session(session ?? null);
  }

  /** Todos los presupuestos del mes (y de la moneda, si se indica). */
  async delMes({ periodo, moneda }, { session } = {}) {
    return this.modelo
      .find(this._filtro({ periodo, ...(moneda && { moneda }) }))
      .session(session ?? null);
  }

  /** Suma de los presupuestos por categoría de un mes y moneda (Decimal128), sin contar uno si se indica. */
  async sumaDeCategorias({ periodo, moneda }, { excluirId, session } = {}) {
    const [fila] = await this.agregar(
      [
        {
          $match: {
            periodo,
            moneda,
            categoriaId: { $ne: null },
            ...(excluirId && { _id: { $ne: id(excluirId) } }),
          },
        },
        { $group: { _id: null, total: { $sum: '$monto' } } },
      ],
      { session },
    );
    return fila?.total ?? CERO();
  }

  contarCategoriasDelMes({ periodo, moneda }, { session } = {}) {
    return this.contar({ periodo, moneda, categoriaId: { $ne: null } }, { session });
  }

  contarPorCategoria(categoriaId, { session } = {}) {
    return this.contar({ categoriaId: id(categoriaId) }, { session });
  }
}

export const presupuestoRepository = (tenantId) => new PresupuestoRepository(tenantId);
