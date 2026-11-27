// Traducción por texto (HU-32). El español es la fuente: cada texto español se busca en un mapa armado a partir de
// pares de catálogos con la misma forma. Los mensajes que son funciones se convierten en expresiones regulares.
import { IDIOMAS } from '../constantes.js';

// Marcador de posición: un carácter de uso privado que ningún texto real contiene.
const marca = (i) => `${i}`;
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** Recorre en paralelo un catálogo español y su equivalente; registra textos fijos y plantillas. */
function recorrer(es, en, fijos, plantillas) {
  if (typeof es === 'string') {
    if (typeof en === 'string') fijos.set(es, en);
    return;
  }
  if (typeof es === 'function') {
    if (typeof en !== 'function') return;
    const cantidad = Math.max(es.length, 1);
    const marcas = Array.from({ length: cantidad }, (_, i) => marca(i));
    const patron = es(...marcas);
    const destino = en(...marcas);
    const orden = [];
    const fuente = escaparRegex(patron).replace(/(\d+)/g, (_, i) => {
      orden.push(Number(i));
      return '(.+?)';
    });
    plantillas.push({ regex: new RegExp(`^${fuente}$`, 's'), orden, destino, largo: patron.length });
    // Las plantillas con singular/plural según el valor (p. ej. "1 minuto") se registran también con 1.
    if (cantidad === 1) fijos.set(es(1), en(1));
    return;
  }
  if (es && typeof es === 'object') {
    for (const clave of Object.keys(es)) recorrer(es[clave], en?.[clave], fijos, plantillas);
  }
}

/**
 * Crea un traductor a partir de pares [catálogoEspañol, catálogoInglés] (objetos anidados con textos y funciones) o
 * [null, { español: inglés }] (mapas planos). Devuelve `traducir(texto, idioma)`: en español o sin traducción conocida
 * devuelve el texto tal cual.
 *
 * Los valores que una plantilla lleva dentro (p. ej. "El nombre" en "El nombre es obligatorio") solo se traducen con
 * `valores`, un mapa plano de etiquetas: así un dato escrito por la persona (una categoría que se llame "Saldo") nunca
 * se traduce por coincidir con un texto de la interfaz.
 */
export function crearTraductor(pares, { valores = {} } = {}) {
  const fijos = new Map();
  const plantillas = [];
  for (const [es, en] of pares) {
    if (es === null && en && typeof en === 'object') {
      // Mapa plano { español: inglés }.
      for (const [clave, valor] of Object.entries(en)) fijos.set(clave, valor);
    } else {
      recorrer(es, en, fijos, plantillas);
    }
  }
  // Las plantillas más largas primero: son las más específicas.
  plantillas.sort((a, b) => b.largo - a.largo);

  function aIngles(texto) {
    if (fijos.has(texto)) return fijos.get(texto);
    for (const { regex, orden, destino } of plantillas) {
      const coincidencia = regex.exec(texto);
      if (!coincidencia) continue;
      return orden.reduce((salida, indice, posicion) => {
        const valor = coincidencia[posicion + 1];
        return salida.replace(marca(indice), valores[valor] ?? valor);
      }, destino);
    }
    return texto;
  }

  return function traducir(texto, idioma) {
    if (idioma !== IDIOMAS.EN || typeof texto !== 'string' || texto === '') return texto;
    return aIngles(texto);
  };
}

/** Idioma a partir de un encabezado Accept-Language o de `navigator.language`: inglés si empieza por "en". */
export function idiomaDe(preferencia) {
  const primero = String(preferencia ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return primero.startsWith('en') ? IDIOMAS.EN : IDIOMAS.ES;
}
