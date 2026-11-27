// Tokens de DESIGN.md para el código que no puede leer el CSS (Chart.js, SweetAlert2).
// tests/tokens.test.js comprueba que coinciden con los de index.css.

export const COLORES = Object.freeze({
  tapa: '#123F4A',
  tapaTexto: '#F4F8F6',
  tapaTextoSuave: '#B9D0CF',
  sello: '#54399E',
  papel: '#EDF3F0',
  hoja: '#F9FBFA',
  tinta: '#14262E',
  tintaSuave: '#4F626B',
  filete: '#C9D6D2',
  borde: '#7A8C86',
  ingreso: '#0A6B55',
  ingresoFondo: '#DDF1EA',
  gasto: '#A62E26',
  gastoFondo: '#FBE6E2',
  atencion: '#7A4F00',
  atencionFondo: '#FBEFCB',
});

// Alto contraste (HU-33): redefine los mismos tokens en html[data-contraste='alto'] con pares de al menos 7:1.
export const COLORES_ALTO_CONTRASTE = Object.freeze({
  tapa: '#0B2229',
  tapaTexto: '#FFFFFF',
  tapaTextoSuave: '#DBE8E6',
  sello: '#3B2280',
  selloOscuro: '#2A1660',
  papel: '#FFFFFF',
  hoja: '#FFFFFF',
  tinta: '#000000',
  tintaSuave: '#25343A',
  filete: '#5B6B66',
  borde: '#25343A',
  ingreso: '#004A3B',
  ingresoFondo: '#E3F4ED',
  gasto: '#7D1A14',
  gastoFondo: '#FDEBE8',
  atencion: '#4D3200',
  atencionFondo: '#FFF3D1',
});

// Gráficos validados sobre la hoja (#F9FBFA).
export const COLORES_GRAFICO = Object.freeze({
  ingresos: '#00897B',
  gastos: '#C8551F',
  // Orden fijo; de la novena categoría en adelante se agrupa en "Otras".
  categorias: Object.freeze([
    '#0B7F9E',
    '#CC7A10',
    '#6A4FC0',
    '#3FA34D',
    '#D1477A',
    '#8A8F12',
    '#2F6FE0',
    '#B5562C',
  ]),
  otras: '#6F827C',
});
