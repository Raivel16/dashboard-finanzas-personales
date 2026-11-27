// Preferencias de idioma y accesibilidad de quien usa la aplicación (HU-32, HU-33). Es un almacén pequeño, fuera de
// React, para que el cliente HTTP y los formatos también lo lean. Sin sesión se recuerda en localStorage y el idioma
// inicial sale del navegador; con sesión manda el perfil.
import { IDIOMAS, idiomaDe } from '@finanzas/shared';

const CLAVE = 'finanzas.preferencias';

function leerGuardadas() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(CLAVE) ?? 'null') ?? {};
  } catch {
    return {};
  }
}

function guardar(preferencias) {
  try {
    globalThis.localStorage?.setItem(CLAVE, JSON.stringify(preferencias));
  } catch {
    // Sin almacenamiento (modo privado): la preferencia dura lo que dure la pestaña.
  }
}

function iniciales() {
  const guardadas = leerGuardadas();
  return {
    idioma: Object.values(IDIOMAS).includes(guardadas.idioma)
      ? guardadas.idioma
      : idiomaDe(globalThis.navigator?.language),
    textoGrande: guardadas.textoGrande === true,
    altoContraste: guardadas.altoContraste === true,
  };
}

/** Refleja las preferencias en <html>: idioma para el lector de pantalla, texto grande y alto contraste. */
function aplicarAlDocumento({ idioma, textoGrande, altoContraste }) {
  const raiz = globalThis.document?.documentElement;
  if (!raiz) return;
  raiz.lang = idioma;
  if (textoGrande) raiz.dataset.texto = 'grande';
  else delete raiz.dataset.texto;
  if (altoContraste) raiz.dataset.contraste = 'alto';
  else delete raiz.dataset.contraste;
}

let actuales = iniciales();
const oyentes = new Set();
aplicarAlDocumento(actuales);

export const obtenerPreferencias = () => actuales;
export const obtenerIdioma = () => actuales.idioma;

export function suscribirPreferencias(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/** Cambia una o varias preferencias; solo se toman las claves conocidas. */
export function cambiarPreferencias(cambios = {}) {
  const siguiente = { ...actuales };
  if (Object.values(IDIOMAS).includes(cambios.idioma)) siguiente.idioma = cambios.idioma;
  if (typeof cambios.textoGrande === 'boolean') siguiente.textoGrande = cambios.textoGrande;
  if (typeof cambios.altoContraste === 'boolean') siguiente.altoContraste = cambios.altoContraste;
  if (
    siguiente.idioma === actuales.idioma &&
    siguiente.textoGrande === actuales.textoGrande &&
    siguiente.altoContraste === actuales.altoContraste
  ) {
    return;
  }
  actuales = siguiente;
  guardar(actuales);
  aplicarAlDocumento(actuales);
  oyentes.forEach((oyente) => oyente());
}

/** Vuelve a leer las preferencias guardadas y del navegador (solo para pruebas). */
export function reiniciarPreferencias() {
  actuales = iniciales();
  aplicarAlDocumento(actuales);
  oyentes.forEach((oyente) => oyente());
}
