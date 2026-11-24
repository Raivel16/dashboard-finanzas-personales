import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { vi } from 'vitest';

// jsdom no tiene canvas: Chart.js no puede dibujar. Los gráficos se simulan con un elemento que conserva sus
// propiedades (datos y opciones) en `globalThis.__graficos` para que las pruebas las comprueben.
vi.mock('react-chartjs-2', () => {
  const simular = (nombre) =>
    function GraficoSimulado(props) {
      globalThis.__graficos = { ...globalThis.__graficos, [nombre]: props };
      return createElement('div', { role: 'img', 'aria-label': props['aria-label'], 'data-grafico': nombre });
    };
  return { Bar: simular('barras'), Doughnut: simular('circular') };
});

// jsdom no implementa matchMedia: por defecto se simula una pantalla de celular sin preferencias.
export function simularMediaQuery(coincidencias = {}) {
  window.matchMedia = (consulta) => ({
    matches: Boolean(coincidencias[consulta]),
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
simularMediaQuery();

// jsdom tampoco implementa scrollIntoView ni ResizeObserver.
Element.prototype.scrollIntoView ??= () => {};
