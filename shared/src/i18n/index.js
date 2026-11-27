// Idioma de la aplicación (HU-32): catálogo inglés y traductor por texto compartidos por cliente y servidor.
import { CATEGORIAS_PREDETERMINADAS, IDIOMAS } from '../constantes.js';
import { MENSAJES } from '../mensajes.js';
import { MENSAJES_EN, NOMBRES_CATEGORIAS_EN, TEXTOS_API_EN } from './mensajes.en.js';
import { crearTraductor } from './traductor.js';

export { MENSAJES_EN, TEXTOS_API_EN, NOMBRES_CATEGORIAS_EN } from './mensajes.en.js';
export { crearTraductor, idiomaDe } from './traductor.js';

/** Pares de catálogos de los mensajes compartidos; el cliente les suma su propio diccionario de pantallas. */
export const CATALOGOS_COMPARTIDOS = Object.freeze([
  [MENSAJES, MENSAJES_EN],
  [null, TEXTOS_API_EN],
]);

/** Traductor de los mensajes compartidos (lo usa el servidor para sus respuestas). */
export const traducirMensaje = crearTraductor(CATALOGOS_COMPARTIDOS, { valores: TEXTOS_API_EN });

/** Categorías predeterminadas con el nombre en el idioma de registro. */
export function categoriasPredeterminadas(idioma = IDIOMAS.ES) {
  if (idioma !== IDIOMAS.EN) return CATEGORIAS_PREDETERMINADAS;
  return CATEGORIAS_PREDETERMINADAS.map((c, i) => ({ ...c, nombre: NOMBRES_CATEGORIAS_EN[i] }));
}
