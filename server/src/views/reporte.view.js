// Archivos de los reportes (PDF con jsPDF y Excel con SheetJS). Se arman completos en memoria y recién entonces se
// responden: si algo falla no sale ningún archivo a medias.
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { montoATexto } from '../utils/dinero.js';

// Textos del archivo en el idioma de la persona (HU-32). Los nombres que ella registró no se traducen.
const TEXTOS = {
  es: {
    tipo: { ingreso: 'Ingreso', gasto: 'Gasto' },
    movimientos: ['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Moneda', 'Monto', 'Descripción'],
    resumen: ['Moneda', 'Tipo', 'Categoría', 'Cantidad', 'Total'],
    totales: ['Moneda', 'Ingresos', 'Gastos', 'Balance'],
    hojas: ['Movimientos', 'Resumen'],
    titulo: 'Reporte de movimientos',
    periodo: (desde, hasta) => `Período: ${desde ?? 'el inicio'} al ${hasta ?? 'hoy'}`,
  },
  en: {
    tipo: { ingreso: 'Income', gasto: 'Expense' },
    movimientos: ['Date', 'Type', 'Category', 'Account', 'Currency', 'Amount', 'Description'],
    resumen: ['Currency', 'Type', 'Category', 'Count', 'Total'],
    totales: ['Currency', 'Income', 'Expenses', 'Balance'],
    hojas: ['Movements', 'Summary'],
    titulo: 'Movements report',
    periodo: (desde, hasta) => `Period: ${desde ?? 'the beginning'} to ${hasta ?? 'today'}`,
  },
};
const textos = (idioma) => TEXTOS[idioma] ?? TEXTOS.es;

/** Monto con separador de miles y dos decimales (la moneda va en su propia columna). */
function conMiles(valor) {
  const [entero, decimales] = montoATexto(valor).split('.');
  return `${entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimales}`;
}

export function nombreArchivo(datos, extension) {
  const base = datos.periodo.desde ? datos.periodo.desde.slice(0, 7) : 'historial';
  return `movimientos-${base}.${extension}`;
}

export function excelDeMovimientos({ filas, resumen, idioma }) {
  const t = textos(idioma);
  const libro = XLSX.utils.book_new();
  const movimientos = XLSX.utils.aoa_to_sheet([
    t.movimientos,
    ...filas.map((f) => [
      f.fecha,
      t.tipo[f.tipo],
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
  XLSX.utils.book_append_sheet(libro, movimientos, t.hojas[0]);

  const hojaResumen = XLSX.utils.aoa_to_sheet([
    t.resumen,
    ...resumen.map((r) => [r.moneda, t.tipo[r.tipo], r.categoria, r.cantidad, Number(montoATexto(r.total))]),
  ]);
  hojaResumen['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(libro, hojaResumen, t.hojas[1]);
  return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
}

export function pdfDeMovimientos({ periodo, filas, porMoneda, idioma }) {
  const t = textos(idioma);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(16).text(t.titulo, 40, 48);
  doc.setFontSize(10).text(t.periodo(periodo.desde, periodo.hasta), 40, 66);

  autoTable(doc, {
    startY: 84,
    head: [t.totales],
    body: porMoneda.map((t) => [t.moneda, conMiles(t.ingresos), conMiles(t.gastos), conMiles(t.balance)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 94, 74] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [t.movimientos],
    body: filas.map((f) => [
      f.fecha,
      t.tipo[f.tipo],
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
