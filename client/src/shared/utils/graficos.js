// Chart.js con los colores, la tipografía y las esquinas de DESIGN.md.
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { COLORES, COLORES_GRAFICO } from './tokens.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

/** Aplica el tema una sola vez a los valores por defecto de Chart.js. */
export function aplicarTemaGraficos() {
  ChartJS.defaults.font.family = "'Public Sans Variable', system-ui, sans-serif";
  ChartJS.defaults.font.size = 13;
  ChartJS.defaults.color = COLORES.tintaSuave;
  ChartJS.defaults.borderColor = COLORES.filete;
  ChartJS.defaults.plugins.legend.display = true; // la leyenda es obligatoria con 2 o más series
  ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
  ChartJS.defaults.plugins.tooltip.backgroundColor = COLORES.tinta;
  ChartJS.defaults.plugins.tooltip.titleColor = COLORES.hoja;
  ChartJS.defaults.plugins.tooltip.bodyColor = COLORES.hoja;
  ChartJS.defaults.plugins.tooltip.cornerRadius = 4;
  ChartJS.defaults.plugins.tooltip.padding = 10;
  ChartJS.defaults.elements.bar.borderRadius = 4;
  ChartJS.defaults.elements.arc.borderColor = COLORES.hoja; // separación de 2 px entre segmentos
  ChartJS.defaults.elements.arc.borderWidth = 2;
}

/** Color de la categoría i-ésima (por orden fijo); desde la novena se agrupa en "Otras". */
export const colorDeCategoria = (indice) => COLORES_GRAFICO.categorias[indice] ?? COLORES_GRAFICO.otras;

export { ChartJS };
