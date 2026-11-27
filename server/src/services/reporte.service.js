// Reportes exportables (HU-16, HU-17, HU-31): reúne los movimientos propios del filtro, con un tope, y calcula los
// totales por moneda con decimal.js. Los archivos los arma la vista; aquí solo se prepara el contenido.
import Decimal from 'decimal.js';
import { MAX_MOVIMIENTOS_REPORTE, MENSAJES } from '@finanzas/shared';
import { ValidationError } from '../utils/errores.js';
import { dateATexto, limitesDelMes, periodoActual } from '../utils/fechas.js';
import { filtroDeMovimientos } from '../utils/filtro-movimientos.js';
import { categoriaRepository } from '../repositories/categoria.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { movimientoRepository } from '../repositories/movimiento.repository.js';

const dec = (valor) => new Decimal(String(valor));
const LIMITE_NOMBRES = 1000;

/** Sin fechas el reporte cubre el mes en curso; con alguna, el rango pedido (la vista arma la etiqueta). */
function periodoDe({ desde, hasta }, actual) {
  if (!desde && !hasta) {
    const mes = limitesDelMes(actual);
    return { desde: mes.desde, hasta: mes.hasta };
  }
  return { desde, hasta };
}

export function crearReporteService({ config, reloj }) {
  return {
    /** Movimientos del filtro (máximo 5000), con nombres de categoría y cuenta, y totales por moneda. */
    async movimientos(actor, consulta) {
      const periodo = periodoDe(consulta, periodoActual(config.zonaHoraria, reloj.ahora()));
      const filtro = filtroDeMovimientos({ ...consulta, desde: periodo.desde, hasta: periodo.hasta });
      const repositorio = movimientoRepository(actor.tenantId);

      const total = await repositorio.contar(filtro);
      if (total === 0) throw new ValidationError([], MENSAJES.reporte.sinDatos);
      if (total > MAX_MOVIMIENTOS_REPORTE) {
        throw new ValidationError([], MENSAJES.reporte.supera(MAX_MOVIMIENTOS_REPORTE));
      }

      const [{ items }, categorias, cuentas] = await Promise.all([
        repositorio.listar(filtro, { page: 1, limit: MAX_MOVIMIENTOS_REPORTE, sort: 'fecha createdAt' }),
        categoriaRepository(actor.tenantId).listar({}, { page: 1, limit: LIMITE_NOMBRES, sort: 'nombre' }),
        cuentaRepository(actor.tenantId).listar({}, { page: 1, limit: LIMITE_NOMBRES, sort: 'nombre' }),
      ]);
      const nombre = (lista, valor) =>
        lista.items.find((x) => String(x._id) === String(valor))?.nombre ?? '—';

      const filas = items.map((m) => ({
        fecha: dateATexto(m.fecha),
        tipo: m.tipo,
        categoria: nombre(categorias, m.categoriaId),
        cuenta: nombre(cuentas, m.cuentaId),
        moneda: m.moneda,
        monto: dec(m.monto),
        descripcion: m.descripcion ?? '',
      }));
      return { periodo, filas, ...totalesPorMoneda(filas) };
    },
  };
}

/** Ingresos, gastos y balance por moneda, y el total por moneda, tipo y categoría (hoja "Resumen"). */
function totalesPorMoneda(filas) {
  const monedas = new Map();
  const detalle = new Map();
  for (const f of filas) {
    const t = monedas.get(f.moneda) ?? { moneda: f.moneda, ingresos: dec(0), gastos: dec(0) };
    if (f.tipo === 'ingreso') t.ingresos = t.ingresos.plus(f.monto);
    else t.gastos = t.gastos.plus(f.monto);
    monedas.set(f.moneda, t);

    const clave = `${f.moneda}|${f.tipo}|${f.categoria}`;
    const d = detalle.get(clave) ?? {
      moneda: f.moneda,
      tipo: f.tipo,
      categoria: f.categoria,
      cantidad: 0,
      total: dec(0),
    };
    d.cantidad += 1;
    d.total = d.total.plus(f.monto);
    detalle.set(clave, d);
  }
  const porMoneda = [...monedas.values()]
    .map((t) => ({ ...t, balance: t.ingresos.minus(t.gastos) }))
    .sort((a, b) => a.moneda.localeCompare(b.moneda));
  const resumen = [...detalle.values()].sort(
    (a, b) =>
      a.moneda.localeCompare(b.moneda) ||
      a.tipo.localeCompare(b.tipo) ||
      a.categoria.localeCompare(b.categoria),
  );
  return { porMoneda, resumen };
}
