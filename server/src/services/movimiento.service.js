// Movimientos propios (HU-08, HU-09, HU-26, HU-27). El inquilino y el creador salen siempre de la sesión.
// Crear, editar y eliminar son una sola transacción que guarda el movimiento y ajusta el saldo de las cuentas
// afectadas: nunca queda un movimiento sin descontarse ni un descuento sin movimiento.
import Decimal from 'decimal.js';
import { MENSAJES, TIPOS_MOVIMIENTO, crearEsquemaMovimiento, validar } from '@finanzas/shared';
import { NotFoundError, ValidationError } from '../utils/errores.js';
import { aDecimal128, montoATexto } from '../utils/dinero.js';
import { dateATexto, hoy, textoADate } from '../utils/fechas.js';
import { porcentajeUsado, umbralCruzado } from '../utils/presupuesto.js';
import { filtroDeMovimientos as filtroDe } from '../utils/filtro-movimientos.js';
import { enTransaccion } from '../utils/transaccion.js';
import { categoriaRepository } from '../repositories/categoria.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { ModeloMovimiento, movimientoRepository } from '../repositories/movimiento.repository.js';
import { presupuestoRepository } from '../repositories/presupuesto.repository.js';

const CAMPOS_EDITABLES = ['tipo', 'monto', 'fecha', 'categoriaId', 'cuentaId', 'descripcion'];
const comoDecimal = (valor) => new Decimal(String(valor));
/** Efecto de un movimiento sobre el saldo de su cuenta: un ingreso suma y un gasto resta. */
const efecto = (tipo, monto) => (tipo === TIPOS_MOVIMIENTO.INGRESO ? comoDecimal(monto) : comoDecimal(monto).neg());

/** Un movimiento visto como gasto de un mes y una moneda (null si es un ingreso o no existe). */
const comoGasto = (movimiento) =>
  movimiento?.tipo === TIPOS_MOVIMIENTO.GASTO
    ? {
        monto: comoDecimal(movimiento.monto),
        periodo: dateATexto(movimiento.fecha).slice(0, 7),
        moneda: movimiento.moneda,
        categoriaId: String(movimiento.categoriaId),
      }
    : null;

/** ¿El gasto cuenta para ese presupuesto? Mismo mes y moneda y, si es de categoría, la misma categoría. */
const cuentaPara = (gasto, presupuesto) =>
  gasto !== null &&
  gasto.periodo === presupuesto.periodo &&
  gasto.moneda === presupuesto.moneda &&
  (!presupuesto.categoriaId || String(presupuesto.categoriaId) === gasto.categoriaId);

export function crearMovimientoService({ admin, logger, config, reloj }) {
  const esquema = () => crearEsquemaMovimiento({ hoy: hoy(config.zonaHoraria, reloj.ahora()) });

  function validarDatos(entrada) {
    const resultado = validar(esquema(), entrada);
    if (!resultado.valido) throw new ValidationError(resultado.errores);
    return resultado.datos;
  }

  /** La cuenta y la categoría deben ser del mismo inquilino y la categoría del mismo tipo (HU-27). */
  async function cargarReferencias(tenantId, datos, session) {
    // Una sesión con transacción no admite operaciones en paralelo: se leen una tras otra.
    const cuenta = await cuentaRepository(tenantId).encontrarPorId(datos.cuentaId, { session });
    const categoria = await categoriaRepository(tenantId).encontrarPorId(datos.categoriaId, { session });
    const errores = [];
    if (!cuenta) errores.push({ campo: 'cuentaId', mensaje: MENSAJES.movimiento.cuentaNoExiste });
    if (!categoria) errores.push({ campo: 'categoriaId', mensaje: MENSAJES.movimiento.categoriaNoExiste });
    else if (categoria.tipo !== datos.tipo) {
      const mensaje =
        datos.tipo === TIPOS_MOVIMIENTO.INGRESO ? MENSAJES.movimiento.categoriaIngreso : MENSAJES.movimiento.categoriaGasto;
      errores.push({ campo: 'categoriaId', mensaje });
    }
    if (errores.length > 0) throw new ValidationError(errores);
    return { cuenta, categoria };
  }

  const ajustarSaldo = (tenantId, cuentaId, delta, session) =>
    cuentaRepository(tenantId).actualizarPorId(cuentaId, { $inc: { saldoActual: aDecimal128(delta) } }, { session });

  /**
   * Comprueba que cada cuenta tocada cumpla saldoActual = saldoInicial + ingresos − gastos; si no, lo corrige y deja
   * un aviso en el log (diseño base, decisión 7).
   */
  async function verificarSaldos(tenantId, cuentaIds, session) {
    for (const cuentaId of new Set(cuentaIds.map(String))) {
      const cuentas = cuentaRepository(tenantId);
      const cuenta = await cuentas.encontrarPorId(cuentaId, { session });
      if (!cuenta) continue;
      const neto = await movimientoRepository(tenantId).netoPorCuenta(cuentaId, { session });
      const esperado = comoDecimal(cuenta.saldoInicial).plus(comoDecimal(neto));
      if (!esperado.equals(comoDecimal(cuenta.saldoActual))) {
        logger.warn(
          { cuentaId, guardado: montoATexto(cuenta.saldoActual), esperado: esperado.toFixed(2) },
          'saldo de cuenta corregido: no coincidía con saldo inicial + ingresos − gastos',
        );
        await cuentas.actualizarPorId(cuentaId, { saldoActual: aDecimal128(esperado) }, { session });
      }
    }
  }

  /**
   * Alertas de presupuesto (HU-15): para cada presupuesto al que suma el gasto nuevo, compara el porcentaje de antes y
   * de después del cambio; si cruza 90 % o 100 % hay una alerta. Se llama con el movimiento ya guardado, dentro de la
   * misma transacción, y no guarda estado: cada cruce se avisa una sola vez.
   */
  async function calcularAlertas(tenantId, antes, despues, session) {
    const nuevo = comoGasto(despues);
    if (nuevo === null) return [];
    const anterior = comoGasto(antes);
    const presupuestos = (await presupuestoRepository(tenantId).delMes(nuevo, { session })).filter((p) =>
      cuentaPara(nuevo, p),
    );
    const alertas = [];
    for (const presupuesto of presupuestos) {
      const gastado = comoDecimal(
        await movimientoRepository(tenantId).gastoDelMes(
          { periodo: nuevo.periodo, moneda: nuevo.moneda, categoriaId: presupuesto.categoriaId },
          { session },
        ),
      );
      const gastadoAntes = gastado.minus(nuevo.monto).plus(cuentaPara(anterior, presupuesto) ? anterior.monto : 0);
      const despuesPct = porcentajeUsado(gastado, presupuesto.monto);
      const umbral = umbralCruzado(porcentajeUsado(gastadoAntes, presupuesto.monto), despuesPct);
      if (umbral !== null) {
        alertas.push({
          presupuestoId: presupuesto._id,
          umbral,
          porcentaje: despuesPct.floor(),
          categoriaId: presupuesto.categoriaId,
        });
      }
    }
    return alertas;
  }

  const advertenciaSaldo = (datos, disponible) =>
    datos.tipo === TIPOS_MOVIMIENTO.GASTO && comoDecimal(datos.monto).greaterThan(comoDecimal(disponible))
      ? [MENSAJES.movimiento.saldoInsuficiente]
      : [];

  return {
    /** Historial con `saldoResultante` por movimiento; los filtros no alteran ese saldo. */
    async listar(actor, { page, limit, sort, ...filtros }) {
      return movimientoRepository(actor.tenantId).listarConSaldo(filtroDe(filtros), { page, limit, sort });
    },

    async obtener(actor, movimientoId) {
      const movimiento = await movimientoRepository(actor.tenantId).encontrarPorId(movimientoId);
      if (!movimiento) throw new NotFoundError();
      return movimiento;
    },

    async crear(actor, cuerpo) {
      const datos = validarDatos(cuerpo);
      return enTransaccion(async (session) => {
        const { cuenta } = await cargarReferencias(actor.tenantId, datos, session);
        const advertencias = advertenciaSaldo(datos, cuenta.saldoActual);
        const movimiento = await movimientoRepository(actor.tenantId).crear(
          {
            tipo: datos.tipo,
            monto: aDecimal128(datos.monto),
            moneda: cuenta.moneda, // siempre la de su cuenta, nunca la del cuerpo
            fecha: textoADate(datos.fecha),
            categoriaId: datos.categoriaId,
            cuentaId: cuenta._id,
            descripcion: datos.descripcion ?? '',
            usuarioId: actor.id,
          },
          { session },
        );
        await ajustarSaldo(actor.tenantId, cuenta._id, efecto(datos.tipo, datos.monto), session);
        await verificarSaldos(actor.tenantId, [cuenta._id], session);
        const alertas = await calcularAlertas(actor.tenantId, null, movimiento, session);
        return { movimiento, advertencias, alertas };
      });
    },

    /**
     * Edita cualquier subconjunto de campos: se combinan con los guardados y se valida el resultado completo, así que
     * un campo obligatorio vacío o un monto inválido se rechaza sin alterar el registro. Revierte el efecto anterior
     * sobre la cuenta de origen y aplica el nuevo sobre la de destino (la misma u otra, con su moneda).
     */
    async actualizar(actor, movimientoId, cuerpo = {}) {
      const recibidos = CAMPOS_EDITABLES.filter((campo) => cuerpo?.[campo] !== undefined);
      if (recibidos.length === 0) {
        throw new ValidationError([{ campo: 'monto', mensaje: MENSAJES.movimiento.sinCambios }]);
      }
      return enTransaccion(async (session) => {
        const repositorio = movimientoRepository(actor.tenantId);
        const actual = await repositorio.encontrarPorId(movimientoId, { session });
        if (!actual) throw new NotFoundError();

        const datos = validarDatos({
          tipo: actual.tipo,
          monto: montoATexto(actual.monto),
          fecha: dateATexto(actual.fecha),
          categoriaId: String(actual.categoriaId),
          cuentaId: String(actual.cuentaId),
          descripcion: actual.descripcion,
          ...Object.fromEntries(recibidos.map((campo) => [campo, cuerpo[campo]])),
        });
        const { cuenta } = await cargarReferencias(actor.tenantId, datos, session);

        // Saldo disponible para el aviso: el de la cuenta destino sin el efecto que este movimiento ya tenía en ella.
        const efectoAnterior = efecto(actual.tipo, actual.monto);
        const mismaCuenta = String(actual.cuentaId) === String(cuenta._id);
        const disponible = comoDecimal(cuenta.saldoActual).minus(mismaCuenta ? efectoAnterior : 0);
        const advertencias = advertenciaSaldo(datos, disponible);

        await ajustarSaldo(actor.tenantId, actual.cuentaId, efectoAnterior.neg(), session);
        await ajustarSaldo(actor.tenantId, cuenta._id, efecto(datos.tipo, datos.monto), session);
        const movimiento = await repositorio.actualizarPorId(
          actual._id,
          {
            tipo: datos.tipo,
            monto: aDecimal128(datos.monto),
            moneda: cuenta.moneda,
            fecha: textoADate(datos.fecha),
            categoriaId: datos.categoriaId,
            cuentaId: cuenta._id,
            descripcion: datos.descripcion ?? '',
          },
          { session },
        );
        await verificarSaldos(actor.tenantId, [actual.cuentaId, cuenta._id], session);
        const alertas = await calcularAlertas(actor.tenantId, actual, movimiento, session);
        return { movimiento, advertencias, alertas };
      });
    },

    /** Elimina el movimiento y revierte su efecto sobre el saldo de la cuenta. */
    async eliminar(actor, movimientoId) {
      await enTransaccion(async (session) => {
        const repositorio = movimientoRepository(actor.tenantId);
        const movimiento = await repositorio.encontrarPorId(movimientoId, { session });
        if (!movimiento) throw new NotFoundError();
        await repositorio.eliminarPorId(movimiento._id, { session });
        await ajustarSaldo(actor.tenantId, movimiento.cuentaId, efecto(movimiento.tipo, movimiento.monto).neg(), session);
        await verificarSaldos(actor.tenantId, [movimiento.cuentaId], session);
      });
      logger.info({ usuarioId: actor.id, movimientoId }, 'movimiento eliminado');
    },

    /** Lectura de administrador (HU-04, HU-22): solo lectura, con el rol comprobado en el servicio. */
    async listarDeUsuario(actor, usuarioId, { page, limit, sort, ...filtros }) {
      const lectura = await admin.repositorioLecturaDe(actor, ModeloMovimiento, usuarioId);
      return lectura.listar(filtroDe(filtros), { page, limit, sort: sort ?? '-fecha' });
    },
  };
}
