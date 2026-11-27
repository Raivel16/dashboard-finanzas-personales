// Identificadores públicos (RT-08): cada documento se identifica con un UUID v4 que genera el servidor. Es el mismo
// valor que la API expone como `id` y que usan las referencias entre colecciones.
import { v4 as uuid, validate, version } from 'uuid';

/** Campo `_id` de los modelos: un UUID v4 que el cliente nunca elige. */
export const ID_UUID = { _id: { type: String, default: () => uuid() } };

/** Referencia a otro documento por su UUID. */
export const REFERENCIA_UUID = { type: String };

/** true si el valor es un UUID v4: los repositorios no consultan la base con identificadores mal formados. */
export const esIdentificador = (valor) =>
  typeof valor === 'string' && validate(valor) && version(valor) === 4;
