// Validador de objetos sobre Validator.js: cada esquema es { campo: regla }.
//
// regla = {
//   requerido?: boolean,        mensajeRequerido?: string,   etiqueta?: string (para el mensaje por defecto)
//   sanear?: (texto) => texto,  reglas?: [{ ok: (texto, datos) => boolean, mensaje }],
//   convertir?: (texto) => valor final,  porDefecto?: valor si el campo viene vacío
// }
//
// Validator.js solo trabaja con texto: los valores primitivos se convierten a cadena antes de validar.
import { MENSAJES } from './mensajes.js';

// El adjetivo concuerda con el artículo de la etiqueta: "El nombre es obligatorio", "La contraseña es obligatoria".
const esFemenina = (etiqueta) => /^las? /i.test(etiqueta);
export const mensajeRequerido = (etiqueta) =>
  esFemenina(etiqueta) ? MENSAJES.generales.requerida(etiqueta) : MENSAJES.generales.requerido(etiqueta);
export const mensajeInvalido = (etiqueta) =>
  esFemenina(etiqueta) ? MENSAJES.generales.invalida(etiqueta) : MENSAJES.generales.invalido(etiqueta);

function comoTexto(valor) {
  if (valor === undefined || valor === null) return '';
  if (typeof valor === 'object' || typeof valor === 'function') return null; // no es un valor simple
  return String(valor);
}

export function validar(esquema, entrada = {}) {
  const datos = {};
  const errores = [];
  const origen = entrada && typeof entrada === 'object' ? entrada : {};

  for (const [campo, regla] of Object.entries(esquema)) {
    let texto = comoTexto(origen[campo]);
    if (texto === null) {
      errores.push({ campo, mensaje: mensajeInvalido(regla.etiqueta ?? campo) });
      continue;
    }
    if (regla.sanear) texto = regla.sanear(texto);

    if (texto === '') {
      if (regla.requerido) {
        errores.push({
          campo,
          mensaje: regla.mensajeRequerido ?? mensajeRequerido(regla.etiqueta ?? campo),
        });
      } else if (regla.porDefecto !== undefined) {
        datos[campo] = regla.porDefecto;
      }
      continue;
    }

    const fallo = (regla.reglas ?? []).find((r) => !r.ok(texto, datos));
    if (fallo) {
      errores.push({ campo, mensaje: fallo.mensaje });
      continue;
    }
    datos[campo] = regla.convertir ? regla.convertir(texto) : texto;
  }

  return { valido: errores.length === 0, datos, errores };
}
