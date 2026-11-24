// Cuentas propias (HU-07, HU-25). El inquilino y el creador salen siempre de la sesión, nunca del cuerpo.
import Decimal from 'decimal.js';
import mongoose from 'mongoose';
import { MENSAJES } from '@finanzas/shared';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errores.js';
import { enTransaccion } from '../utils/transaccion.js';
import { movimientoRepository } from '../repositories/movimiento.repository.js';
import { INTERCALACION, ModeloCuenta, cuentaRepository } from '../repositories/cuenta.repository.js';

const esDuplicado = (error) => error?.code === 11000;
const duplicada = () => new ConflictError(MENSAJES.cuenta.nombreDuplicado);
const aDecimal128 = (decimal) => mongoose.Types.Decimal128.fromString(decimal.toFixed(2));
const comoDecimal = (valor) => new Decimal(String(valor));

export function crearCuentaService({ admin, logger }) {
  return {
    async listar(actor, { tipo, moneda, ...paginacion }) {
      const filtro = { ...(tipo && { tipo }), ...(moneda && { moneda }) };
      return cuentaRepository(actor.tenantId).listarOrdenadas(filtro, paginacion);
    },

    async obtener(actor, id) {
      const cuenta = await cuentaRepository(actor.tenantId).encontrarPorId(id);
      if (!cuenta) throw new NotFoundError();
      return cuenta;
    },

    /** El saldo actual de una cuenta nueva es su saldo inicial. */
    async crear(actor, { nombre, tipo, moneda, saldoInicial }) {
      const saldo = aDecimal128(comoDecimal(saldoInicial));
      try {
        return await cuentaRepository(actor.tenantId).crear({
          nombre,
          tipo,
          moneda,
          saldoInicial: saldo,
          saldoActual: saldo,
          usuarioId: actor.id,
        });
      } catch (error) {
        if (esDuplicado(error)) throw duplicada();
        throw error;
      }
    },

    /**
     * Edita nombre, tipo, moneda y saldo inicial. La moneda no cambia si hay movimientos, y corregir el saldo inicial
     * mueve el saldo actual en la misma diferencia (los movimientos no se tocan); todo en una transacción.
     */
    async actualizar(actor, id, cambios) {
      if (Object.keys(cambios).length === 0) {
        throw new ValidationError([{ campo: 'nombre', mensaje: MENSAJES.cuenta.sinCambios }]);
      }
      const repositorio = cuentaRepository(actor.tenantId);
      try {
        return await enTransaccion(async (session) => {
          const cuenta = await repositorio.encontrarPorId(id, { session });
          if (!cuenta) throw new NotFoundError();

          const nuevos = {};
          if (cambios.nombre !== undefined) nuevos.nombre = cambios.nombre;
          if (cambios.tipo !== undefined) nuevos.tipo = cambios.tipo;

          if (cambios.moneda !== undefined && cambios.moneda !== cuenta.moneda) {
            if ((await movimientoRepository(actor.tenantId).contarPorCuenta(cuenta._id, { session })) > 0) {
              throw new ConflictError(MENSAJES.cuenta.monedaConMovimientos);
            }
            nuevos.moneda = cambios.moneda;
          }

          if (cambios.saldoInicial !== undefined) {
            const diferencia = comoDecimal(cambios.saldoInicial).minus(comoDecimal(cuenta.saldoInicial));
            nuevos.saldoInicial = aDecimal128(comoDecimal(cambios.saldoInicial));
            nuevos.saldoActual = aDecimal128(comoDecimal(cuenta.saldoActual).plus(diferencia));
          }

          return repositorio.actualizarPorId(cuenta._id, nuevos, { session });
        });
      } catch (error) {
        if (esDuplicado(error)) throw duplicada();
        throw error;
      }
    },

    /** No elimina una cuenta con movimientos: la cuenta y el borrado van en la misma transacción. */
    async eliminar(actor, id) {
      const repositorio = cuentaRepository(actor.tenantId);
      await enTransaccion(async (session) => {
        const cuenta = await repositorio.encontrarPorId(id, { session });
        if (!cuenta) throw new NotFoundError();
        if ((await movimientoRepository(actor.tenantId).contarPorCuenta(cuenta._id, { session })) > 0) {
          throw new ConflictError(MENSAJES.cuenta.conMovimientos);
        }
        await repositorio.eliminarPorId(cuenta._id, { session });
      });
      logger.info({ usuarioId: actor.id, cuentaId: id }, 'cuenta eliminada');
    },

    /** Lectura de administrador (HU-04, HU-22): solo lectura, con el rol comprobado en el servicio. */
    async listarDeUsuario(actor, usuarioId, { tipo, moneda, page, limit, sort }) {
      const lectura = await admin.repositorioLecturaDe(actor, ModeloCuenta, usuarioId);
      const filtro = { ...(tipo && { tipo }), ...(moneda && { moneda }) };
      return lectura.listar(filtro, { page, limit, sort, collation: INTERCALACION });
    },
  };
}
