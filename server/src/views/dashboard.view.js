// Representación JSON del dashboard. Los montos salen como texto con dos decimales, nunca como número.
import { montoATexto } from '../utils/dinero.js';

export function indicadoresJson({ periodo, moneda, ingresos, gastos, balance, hayMovimientos, presupuesto }) {
  return {
    periodo,
    moneda,
    ingresos: montoATexto(ingresos),
    gastos: montoATexto(gastos),
    balance: montoATexto(balance),
    hayMovimientos,
    presupuesto: presupuesto && {
      monto: montoATexto(presupuesto.monto),
      gastado: montoATexto(presupuesto.gastado),
      restante: montoATexto(presupuesto.restante),
      porcentaje: Number(presupuesto.porcentaje),
      excedido: presupuesto.excedido,
      sobregiro: montoATexto(presupuesto.sobregiro),
    },
  };
}

export function graficosJson({ periodo, moneda, evolucion, distribucion }) {
  return {
    periodo,
    moneda,
    evolucion: evolucion.map((mes) => ({
      periodo: mes.periodo,
      ingresos: montoATexto(mes.ingresos),
      gastos: montoATexto(mes.gastos),
    })),
    distribucion: {
      total: montoATexto(distribucion.total),
      items: distribucion.items.map((item) => ({
        categoriaId: item.categoriaId,
        nombre: item.nombre,
        total: montoATexto(item.total),
        porcentaje: Number(item.porcentaje),
      })),
    },
  };
}
