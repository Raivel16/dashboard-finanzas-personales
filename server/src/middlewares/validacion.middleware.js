// Aplica los esquemas de shared y traduce los errores al formato de contrato-api.
import { validar } from '@finanzas/shared';
import { ValidationError } from '../utils/errores.js';

function aplicar(esquema, origen, destino) {
  return (req, _res, next) => {
    const resultado = validar(esquema, req[origen]);
    if (!resultado.valido) throw new ValidationError(resultado.errores);
    req[destino] = resultado.datos;
    next();
  };
}

/** Valida req.body y deja los datos saneados en req.datos. */
export const validarCuerpo = (esquema) => aplicar(esquema, 'body', 'datos');

/** Valida req.query y deja los parámetros convertidos en req.consulta (req.query es de solo lectura). */
export const validarConsulta = (esquema) => aplicar(esquema, 'query', 'consulta');
