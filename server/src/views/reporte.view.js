// Archivos de los reportes (PDF con jsPDF y Excel con SheetJS). Se arman completos en memoria y recién entonces se
// responden: si algo falla no sale ningún archivo a medias.
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { montoATexto } from '../utils/dinero.js';

const TIPO = { ingreso: 'Ingreso', gasto: 'Gasto' };
const CABECERA_MOVIMIENTOS = ['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Moneda', 'Monto', 'Descripción'];
const CABECERA_RESUMEN = ['Moneda', 'Tipo', 'Categoría', 'Cantidad', 'Total'];

/** Monto con separador de miles y dos decimales (la moneda va en su propia columna). */
function conMiles(valor) {
  const [entero, decimales] = montoATexto(valor).split('.');
  return `${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimales}`;
}

export function nombreArchivo(datos, extension) {
  const base = datos.periodo.desde ? datos.periodo.desde.slice(0, 7) : 'historial';
  return `movimientos-${base}.${extension}`;
}

export function excelDeMovimientos({ filas, resumen }) {
  const libro = XLSX.utils.book_new();
  const movimientos = XLSX.utils.aoa_to_sheet([
    CABECERA_MOVIMIENTOS,
    ...filas.map((f) => [
      f.fecha,
      TIPO[f.tipo],
      f.categoria,
      f.cuenta,
      f.moneda,
      Number(montoATexto(f.monto)),
      f.descripcion,
    ]),
  ]);
  movimientos['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 8 },
    { wch: 14 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(libro, movimientos, 'Movimientos');

  const hojaResumen = XLSX.utils.aoa_to_sheet([
    CABECERA_RESUMEN,
    ...resumen.map((r) => [r.moneda, TIPO[r.tipo], r.categoria, r.cantidad, Number(montoATexto(r.total))]),
  ]);
  hojaResumen['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen');
  return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

export function pdfDeMovimientos({ periodo, filas, porMoneda }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(16).text('Reporte de movimientos', 40, 48);
  doc.setFontSize(10).text(`Período: ${periodo.etiqueta}`, 40, 66);

  autoTable(doc, {
    startY: 84,
    head: [['Moneda', 'Ingresos', 'Gastos', 'Balance']],
    body: porMoneda.map((t) => [t.moneda, conMiles(t.ingresos), conMiles(t.gastos), conMiles(t.balance)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 94, 74] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [CABECERA_MOVIMIENTOS],
    body: filas.map((f) => [
      f.fecha,
      TIPO[f.tipo],
      f.categoria,
      f.cuenta,
      f.moneda,
      conMiles(f.monto),
      f.descripcion,
    ]),
    styles: { fontSize: 8, overflow: 'linebreak' },
    headStyles: { fillColor: [31, 94, 74] },
    columnStyles: { 5: { halign: 'right' } },
  });
  return Buffer.from(doc.output('arraybuffer'));
}
