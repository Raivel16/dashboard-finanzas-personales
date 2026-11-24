// Único acceso al modelo Movimiento. Siempre se construye con el tenantId del usuario autenticado.
import mongoose from 'mongoose';
import { Movimiento } from '../models/movimiento.model.js';
import { limitesDelMes } from '../utils/fechas.js';
import { RepositorioBase } from './base.repository.js';

/** Para la lectura de administrador (admin.repositorioLecturaDe recibe el modelo). */
export const ModeloMovimiento = Movimiento;

const id = (valor) => new mongoose.Types.ObjectId(valor);

/** Efecto firmado de un movimiento sobre el saldo: ingreso suma y gasto resta. */
const EFECTO = { $cond: [{ $eq: ['$tipo', 'ingreso'] }, '$monto', { $multiply: ['$monto', -1] }] };

/** Criterio de orden estable: el pedido, luego fecha de registro y _id como desempate. */
export function ordenMovimientos(sort = '-fecha') {
  const direccion = sort.startsWith('-') ? -1 : 1;
  const campo = sort.replace(/^-/, '');
  return { [campo]: direccion, createdAt: direccion, _id: direccion };
}

export class MovimientoRepository extends RepositorioBase {
  constructor(tenantId) {
    super(Movimiento, tenantId);
  }

  contarPorCuenta(cuentaId, { session } = {}) {
    return this.contar({ cuentaId: id(cuentaId) }, { session });
  }

  contarPorCategoria(categoriaId, { session } = {}) {
    return this.contar({ categoriaId: id(categoriaId) }, { session });
  }

  /**
   * Gasto de un mes agrupado por moneda y categoría (Decimal128), para medir los presupuestos: el de una categoría
   * usa su fila y el general la suma de todas las de su moneda.
   */
  gastoDelMesPorCategoria(periodo, { session } = {}) {
    const { inicio, finExclusivo } = limitesDelMes(periodo);
    return this.agregar(
      [
        { $match: { tipo: 'gasto', fecha: { $gte: inicio, $lt: finExclusivo } } },
        { $group: { _id: { moneda: '$moneda', categoriaId: '$categoriaId' }, total: { $sum: '$monto' } } },
      ],
      { session },
    );
  }

  /** Gasto de un mes y moneda, de una categoría o de todas (Decimal128; cero si no hay). */
  async gastoDelMes({ periodo, moneda, categoriaId }, { session } = {}) {
    const { inicio, finExclusivo } = limitesDelMes(periodo);
    const [fila] = await this.agregar(
      [
        {
          $match: {
            tipo: 'gasto',
            moneda,
            fecha: { $gte: inicio, $lt: finExclusivo },
            ...(categoriaId && { categoriaId: id(categoriaId) }),
          },
        },
        { $group: { _id: null, total: { $sum: '$monto' } } },
      ],
      { session },
    );
    return fila?.total ?? mongoose.Types.Decimal128.fromString('0');
  }

  /** Suma de ingresos menos gastos de una cuenta (Decimal128; cero si no tiene movimientos). */
  async netoPorCuenta(cuentaId, { session } = {}) {
    const [fila] = await this.agregar(
      [{ $match: { cuentaId: id(cuentaId) } }, { $group: { _id: null, neto: { $sum: EFECTO } } }],
      { session },
    );
    return fila?.neto ?? mongoose.Types.Decimal128.fromString('0');
  }

  /**
   * Historial con el saldo que dejó cada movimiento en su cuenta: saldo inicial más la suma acumulada, por fecha y
   * orden de registro. Los filtros se aplican DESPUÉS de calcular el saldo para que sea el real aunque se filtre.
   */
  async listarConSaldo(filtro, { page, limit, sort }) {
    const [resultado] = await this.agregar([
      {
        $setWindowFields: {
          partitionBy: '$cuentaId',
          sortBy: { fecha: 1, createdAt: 1, _id: 1 },
          output: { acumulado: { $sum: EFECTO, window: { documents: ['unbounded', 'current'] } } },
        },
      },
      {
        $lookup: {
          from: 'cuentas',
          localField: 'cuentaId',
          foreignField: '_id',
          pipeline: [{ $match: { tenantId: this.tenantId } }, { $project: { saldoInicial: 1 } }],
          as: 'cuenta',
        },
      },
      { $addFields: { saldoResultante: { $add: ['$acumulado', { $first: '$cuenta.saldoInicial' }] } } },
      { $project: { cuenta: 0, acumulado: 0 } },
      { $match: filtro },
      {
        $facet: {
          items: [{ $sort: ordenMovimientos(sort) }, { $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: 'n' }],
        },
      },
    ]);
    return { items: resultado.items, total: resultado.total[0]?.n ?? 0 };
  }
}

export const movimientoRepository = (tenantId) => new MovimientoRepository(tenantId);
