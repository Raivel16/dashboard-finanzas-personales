import { CODIGOS_ERROR } from '@finanzas/shared';

/**
 * Convierte un error de la API en errores por campo ({ campo: mensaje }) para el formulario,
 * o null si el error no corresponde a un campo concreto.
 */
export function erroresPorCampo(error) {
  if (error?.codigo === CODIGOS_ERROR.VALIDATION_ERROR && Array.isArray(error.detalles)) {
    return Object.fromEntries(error.detalles.map((d) => [d.campo, d.mensaje]));
  }
  if (error?.codigo === CODIGOS_ERROR.CONFLICT) return { email: error.message };
  return null;
}
