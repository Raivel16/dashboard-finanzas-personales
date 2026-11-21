import '@testing-library/jest-dom/vitest';

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
