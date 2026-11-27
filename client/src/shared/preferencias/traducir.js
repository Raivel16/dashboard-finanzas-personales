// Traducción de los textos de la interfaz (HU-32). El español es la fuente: cada texto se escribe en español dentro
// de t('…') y se busca en el diccionario inglés. Los valores variables van entre llaves: t('Hola, {nombre}', { nombre }).
import { useCallback, useSyncExternalStore } from 'react';
import { CATALOGOS_COMPARTIDOS, TEXTOS_API_EN, crearTraductor } from '@finanzas/shared';
import { TEXTOS_EN } from './textos.en.js';
import {
  cambiarPreferencias,
  obtenerIdioma,
  obtenerPreferencias,
  suscribirPreferencias,
} from './preferencias.js';

const traductor = crearTraductor([...CATALOGOS_COMPARTIDOS, [null, TEXTOS_EN]], { valores: TEXTOS_API_EN });

const interpolar = (texto, valores) =>
  valores
    ? texto.replace(/\{(\w+)\}/g, (marca, clave) => (clave in valores ? String(valores[clave]) : marca))
    : texto;

/** Traduce un texto al idioma vigente (o al indicado). Un texto sin traducción se devuelve tal cual. */
export function traducir(texto, valores, idioma = obtenerIdioma()) {
  if (typeof texto !== 'string') return texto;
  return interpolar(traductor(texto, idioma), valores);
}

/** Preferencias vigentes; el componente se vuelve a pintar cuando cambian. */
export function usePreferencias() {
  const preferencias = useSyncExternalStore(suscribirPreferencias, obtenerPreferencias);
  return { ...preferencias, cambiarPreferencias };
}

/** Función `t` del idioma vigente: cambiar el idioma vuelve a pintar la pantalla sin recargar ni perder el estado. */
export function useT() {
  const idioma = useSyncExternalStore(suscribirPreferencias, obtenerIdioma);
  return useCallback((texto, valores) => traducir(texto, valores, idioma), [idioma]);
}
