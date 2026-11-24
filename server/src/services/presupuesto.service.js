// Presupuestos propios (HU-14, HU-15, HU-29, HU-30). El inquilino y el creador salen siempre de la sesión.
// Las reglas que dependen de otros presupuestos (general antes que categorías, suma dentro del general) se
// comprueban dentro de la misma transacción que escribe.
import Decimal from 'decimal.js';
import { MENSAJES, TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errores.js';
import { aDecimal128 } from '../utils/dinero.js';
import { periodoActual } from '../utils/fechas.js';
import { avance } from '../utils/presupuesto.js';
import { enTransaccion } from '../utils/transaccion.js';
import { categoriaRepository } from '../repositories/categoria.repository.js';
import { movimientoRepository } from '../repositories/movimiento.repository.js';
import { ModeloPresupuesto, presupuestoRepository } from '../repositories/presupuesto.repository.js';

const dec = (valor) => new Decimal(String(valor));
const error = (campo, mensaje) => new ValidationError([{ campo, mensaje }]);
const filtroDe = ({ periodo, moneda }) => ({ ...(periodo && { periodo }), ...(moneda && { moneda }) });
const orden = (sort) => `${sort} moneda`;

export function crearPresupuestoService({ admin, logger, config, reloj }) {
  const actual = () => periodoActual(config.zonaHoraria, reloj.ahora());

  /** Solo se definen o cambian presupuestos del mes actual o de meses futuros; los pasados solo se consultan. */
  function exigirMesVigente(periodo) {
    if (periodo < actual()) throw error('periodo', MENSAJES.presupuesto.mesPasado);
  }

  /** La categoría debe ser propia y de gasto. */
  async function validarCategoria(tenantId, categoriaId, session) {
    const categoria = await categoriaRepository(tenantId).encontrarPorId(categoriaId, { session });
    if (!categoria) throw error('categoriaId', MENSAJES.presupuesto.categoriaNoExiste);
    if (categoria.tipo !== TIPOS_MOVIMIENTO.GASTO) throw error('categoriaId', MENSAJES.presupuesto.categoriaNoEsGasto);
  }

  return {
    async listar(actor, { page, limit, sort, ...filtros }) {
      return presupuestoRepository(actor.tenantId).listar(filtroDe(filtros), { page, limit, sort: orden(sort) });
    },

    /**
     * Cada presupuesto del mes (por defecto el actual) con su avance. El gasto cuenta solo en la moneda y el mes del
     * presupuesto; el general suma todos los gastos y el de categoría solo los de su categoría.
     */
    async seguimiento(actor, { periodo = actual(), moneda } = {}) {
      const presupuestos = await presupuestoRepository(actor.tenantId).delMes({ periodo, moneda });
      const filas = await movimientoRepository(actor.tenantId).gastoDelMesPorCategoria(periodo);
      const gastoDe = (p) =>
        filas
          .filter(
            (f) =>
              f._id.moneda === p.moneda && (!p.categoriaId || String(f._id.categoriaId) === String(p.categoriaId)),
          )
          .reduce((total, f) => total.plus(dec(f.total)), new Decimal(0));
      const asignado = (general) =>
        presupuestos
          .filter((p) => p.categoriaId && p.moneda === general.moneda)
          .reduce((total, p) => total.plus(dec(p.monto)), new Decimal(0));

      const items = presupuestos
        .map((presupuesto) => ({
          presupuesto,
          ...avance(presupuesto.monto, gastoDe(presupuesto)),
          ...(!presupuesto.categoriaId && { sinAsignar: dec(presupuesto.monto).minus(asignado(presupuesto)) }),
        }))
        .sort(
          (a, b) =>
            a.presupuesto.moneda.localeCompare(b.presupuesto.moneda) ||
            Number(Boolean(a.presupuesto.categoriaId)) - Number(Boolean(b.presupuesto.categoriaId)),
        );
      return { periodo, moneda, items };
    },

    async crear(actor, datos) {
      exigirMesVigente(datos.periodo);
      const presupuesto = await enTransaccion(async (session) => {
        const repositorio = presupuestoRepository(actor.tenantId);
        const clave = { periodo: datos.periodo, moneda: datos.moneda, categoriaId: datos.categoriaId ?? null };
        if (datos.categoriaId) await validarCategoria(actor.tenantId, datos.categoriaId, session);
        if (await repositorio.buscarPorClave(clave, { session })) {
          throw new ConflictError(MENSAJES.presupuesto.yaExiste);
        }
        if (datos.categoriaId) {
          const general = await repositorio.buscarPorClave({ ...clave, categoriaId: null }, { session });
          if (!general) throw error('categoriaId', MENSAJES.presupuesto.sinGeneral);
          const asignado = dec(await repositorio.sumaDeCategorias(clave, { session }));
          if (asignado.plus(dec(datos.monto)).gt(dec(general.monto))) {
            throw error('monto', MENSAJES.presupuesto.sumaSuperaGeneral);
          }
        }
        return repositorio.crear({ ...clave, monto: aDecimal128(datos.monto), usuarioId: actor.id }, { session });
      });
      logger.info({ usuarioId: actor.id, presupuestoId: String(presupuesto._id) }, 'presupuesto creado');
      return presupuesto;
    },

    /** Reemplaza el monto de un presupuesto (la confirmación la pide la pantalla antes de llamar). */
    async reemplazar(actor, id, datos) {
      const presupuesto = await enTransaccion(async (session) => {
        const repositorio = presupuestoRepository(actor.tenantId);
        const existente = await repositorio.encontrarPorId(id, { session });
        if (!existente) throw new NotFoundError();
        exigirMesVigente(existente.periodo);
        const clave = { periodo: existente.periodo, moneda: existente.moneda };
        if (existente.categoriaId) {
          const general = await repositorio.buscarPorClave({ ...clave, categoriaId: null }, { session });
          const otras = dec(await repositorio.sumaDeCategorias(clave, { excluirId: existente._id, session }));
          if (!general || otras.plus(dec(datos.monto)).gt(dec(general.monto))) {
            throw error('monto', MENSAJES.presupuesto.sumaSuperaGeneral);
          }
        } else {
          const asignado = dec(await repositorio.sumaDeCategorias(clave, { session }));
          if (dec(datos.monto).lt(asignado)) throw error('monto', MENSAJES.presupuesto.generalMenorAsignado);
        }
        return repositorio.actualizarPorId(existente._id, { monto: aDecimal128(datos.monto) }, { session });
      });
      logger.info({ usuarioId: actor.id, presupuestoId: id }, 'presupuesto reemplazado');
      return presupuesto;
    },

    /** No elimina el general mientras queden presupuestos por categoría del mismo mes y moneda. */
    async eliminar(actor, id) {
      await enTransaccion(async (session) => {
        const repositorio = presupuestoRepository(actor.tenantId);
        const existente = await repositorio.encontrarPorId(id, { session });
        if (!existente) throw new NotFoundError();
        if (!existente.categoriaId && (await repositorio.contarCategoriasDelMes(existente, { session })) > 0) {
          throw new ConflictError(MENSAJES.presupuesto.generalConCategorias);
        }
        await repositorio.eliminarPorId(existente._id, { session });
      });
      logger.info({ usuarioId: actor.id, presupuestoId: id }, 'presupuesto eliminado');
    },

    /** Lectura de administrador (HU-04, HU-22): solo lectura, con el rol comprobado en el servicio. */
    async listarDeUsuario(actor, usuarioId, { page, limit, sort, ...filtros }) {
      const lectura = await admin.repositorioLecturaDe(actor, ModeloPresupuesto, usuarioId);
      return lectura.listar(filtroDe(filtros), { page, limit, sort: orden(sort) });
    },
  };
}
