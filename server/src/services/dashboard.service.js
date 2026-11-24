// Dashboard (HU-12, HU-13, HU-28): consultas de solo lectura sobre los datos de la persona, siempre en una sola
// moneda (sin conversiones). Los montos se suman en la base de datos y los cálculos usan decimal.js.
import Decimal from 'decimal.js';
import { mesAnterior, periodoActual } from '../utils/fechas.js';
import { avance } from '../utils/presupuesto.js';
import { categoriaRepository } from '../repositories/categoria.repository.js';
import { cuentaRepository } from '../repositories/cuenta.repository.js';
import { movimientoRepository } from '../repositories/movimiento.repository.js';
import { presupuestoRepository } from '../repositories/presupuesto.repository.js';

const MESES_EVOLUCION = 6;
const CATEGORIAS_VISIBLES = 8; // el resto se agrupa en "Otras"
const dec = (valor) => new Decimal(String(valor));

/** Los `cantidad` meses que terminan en `hasta`, del más antiguo al más reciente. */
function ultimosMeses(hasta, cantidad) {
  const meses = [hasta];
  while (meses.length < cantidad) meses.unshift(mesAnterior(meses[0]));
  return meses;
}

export function crearDashboardService({ config, reloj }) {
  const actual = () => periodoActual(config.zonaHoraria, reloj.ahora());
  const opciones = (actor, { periodo, moneda }) => ({
    periodo: periodo ?? actual(),
    moneda: moneda ?? actor.monedaPrincipal,
  });

  return {
    /** Monedas que la persona usa (las de sus cuentas) o, si aún no tiene cuentas, solo su moneda principal. */
    async monedas(actor) {
      const enUso = await cuentaRepository(actor.tenantId).monedasEnUso();
      return { principal: actor.monedaPrincipal, monedas: enUso.length > 0 ? enUso : [actor.monedaPrincipal] };
    },

    /** Ingresos, gastos, balance y avance del presupuesto general del mes y la moneda. */
    async indicadores(actor, consulta) {
      const { periodo, moneda } = opciones(actor, consulta);
      const totales = await movimientoRepository(actor.tenantId).totalesDelMes({ periodo, moneda });
      const general = await presupuestoRepository(actor.tenantId).buscarPorClave({ periodo, moneda, categoriaId: null });
      const ingresos = dec(totales.ingresos);
      const gastos = dec(totales.gastos);
      return {
        periodo,
        moneda,
        ingresos,
        gastos,
        balance: ingresos.minus(gastos),
        hayMovimientos: totales.cantidad > 0,
        presupuesto: general ? { monto: dec(general.monto), ...avance(general.monto, gastos) } : null,
      };
    },

    /** Evolución de los últimos 6 meses y distribución de los gastos del mes por categoría. */
    async graficos(actor, consulta) {
      const { periodo, moneda } = opciones(actor, consulta);
      const movimientos = movimientoRepository(actor.tenantId);
      const meses = ultimosMeses(periodo, MESES_EVOLUCION);
      const [filas, porCategoria, categorias] = await Promise.all([
        movimientos.evolucionMensual({ desde: meses[0], hasta: periodo, moneda }),
        movimientos.gastoDelMesPorCategoria(periodo),
        categoriaRepository(actor.tenantId).listar({}, { page: 1, limit: 100, sort: 'nombre' }),
      ]);

      const total = (mes, tipo) => dec(filas.find((f) => f._id.mes === mes && f._id.tipo === tipo)?.total ?? 0);
      const evolucion = meses.map((mes) => ({ periodo: mes, ingresos: total(mes, 'ingreso'), gastos: total(mes, 'gasto') }));

      const gastos = porCategoria
        .filter((fila) => fila._id.moneda === moneda)
        .map((fila) => ({
          categoriaId: String(fila._id.categoriaId),
          nombre: categorias.items.find((c) => String(c._id) === String(fila._id.categoriaId))?.nombre ?? 'Sin categoría',
          total: dec(fila.total),
        }))
        .sort((a, b) => b.total.comparedTo(a.total) || a.nombre.localeCompare(b.nombre));
      const visibles = gastos.slice(0, CATEGORIAS_VISIBLES);
      const resto = gastos.slice(CATEGORIAS_VISIBLES);
      if (resto.length > 0) {
        visibles.push({
          categoriaId: null,
          nombre: 'Otras',
          total: resto.reduce((suma, fila) => suma.plus(fila.total), new Decimal(0)),
        });
      }
      const suma = gastos.reduce((acumulado, fila) => acumulado.plus(fila.total), new Decimal(0));
      const distribucion = {
        total: suma,
        items: visibles.map((fila) => ({
          ...fila,
          porcentaje: suma.isZero() ? new Decimal(0) : fila.total.div(suma).times(100).toDecimalPlaces(1),
        })),
      };
      return { periodo, moneda, evolucion, distribucion };
    },
  };
}
