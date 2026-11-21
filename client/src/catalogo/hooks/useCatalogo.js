import { confirmar, notificar } from '../../shared/utils/notificaciones.js';

const MONEDA = 'PEN';

const FILAS = [
  { id: 1, fecha: '2026-08-01', concepto: 'Sueldo', tipo: 'ingreso', monto: '3200.00', saldo: '3200.00' },
  { id: 2, fecha: '2026-08-03', concepto: 'Alquiler', tipo: 'gasto', monto: '1100.00', saldo: '2100.00' },
  { id: 3, fecha: '2026-08-05', concepto: 'Supermercado', tipo: 'gasto', monto: '212.40', saldo: '1887.60' },
];

const MESES = [
  { etiqueta: 'Jun', ingresos: '3100.00', gastos: '2400.00' },
  { etiqueta: 'Jul', ingresos: '3200.00', gastos: '2650.50' },
  { etiqueta: 'Ago', ingresos: '3200.00', gastos: '1312.40' },
];

const CATEGORIAS = [
  { nombre: 'Vivienda', total: '1100.00' },
  { nombre: 'Alimentación', total: '212.40' },
  { nombre: 'Transporte', total: '98.00' },
];

/** Datos de ejemplo y acciones de la página de catálogo (solo desarrollo). */
export function useCatalogo() {
  const probarConfirmacion = async () => {
    const aceptado = await confirmar({
      titulo: '¿Eliminar este movimiento?',
      texto: 'Esta acción no se puede deshacer.',
      confirmar: 'Eliminar',
      peligro: true,
    });
    if (aceptado) notificar.exito('Movimiento eliminado');
  };

  return {
    moneda: MONEDA,
    filas: FILAS,
    meses: MESES,
    categorias: CATEGORIAS,
    notificar,
    probarConfirmacion,
  };
}
