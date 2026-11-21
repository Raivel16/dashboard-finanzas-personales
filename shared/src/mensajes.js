// Mensajes en español usados por cliente y servidor.
import { LIMITES, PAGINACION } from './constantes.js';

export const MENSAJES = Object.freeze({
  generales: {
    requerido: (campo) => `${campo} es obligatorio`,
    invalido: (campo) => `${campo} no es válido`,
    noExiste: 'El recurso solicitado no existe o no tienes permiso para acceder a él',
    errorInterno: 'Ocurrió un error inesperado. Inténtalo nuevamente.',
    noAutorizado: 'Acceso no autorizado',
    sesionExpirada: 'Tu sesión ha expirado, por favor inicia sesión nuevamente',
    demasiadosIntentos: 'Demasiados intentos. Inténtalo más tarde.',
  },
  usuario: {
    nombre: `El nombre debe tener entre ${LIMITES.NOMBRE_USUARIO.min} y ${LIMITES.NOMBRE_USUARIO.max} caracteres`,
    correo: 'Ingresa un correo electrónico válido',
    contrasena: `La contraseña debe tener entre ${LIMITES.CONTRASENA.min} y ${LIMITES.CONTRASENA.max} caracteres, una mayúscula y un número`,
    contrasenaDistinta: 'Las contraseñas no coinciden',
  },
  nombreCuentaCategoria: `El nombre debe tener entre ${LIMITES.NOMBRE_CUENTA_CATEGORIA.min} y ${LIMITES.NOMBRE_CUENTA_CATEGORIA.max} caracteres`,
  monto: {
    positivo: 'El monto debe ser mayor a 0, con hasta 2 decimales',
    maximo: 'El monto supera el máximo permitido (999,999,999.99)',
    saldo: 'El saldo inicial debe ser un número con hasta 2 decimales',
  },
  fecha: {
    formato: 'La fecha debe tener el formato AAAA-MM-DD',
    futura: 'La fecha no puede ser futura',
    rango: 'La fecha inicial no puede ser posterior a la final',
  },
  periodo: 'El período debe tener el formato AAAA-MM',
  descripcion: `La descripción admite hasta ${LIMITES.DESCRIPCION_MAX} caracteres`,
  moneda: 'Selecciona una moneda válida',
  tipoMovimiento: 'Selecciona un tipo de movimiento válido',
  tipoCuenta: 'Selecciona un tipo de cuenta válido',
  id: 'El identificador no es válido',
  paginacion: {
    pagina: 'page debe ser un número entero mayor o igual a 1',
    limite: `limit debe ser un número entero entre 1 y ${PAGINACION.LIMITE_MAXIMO}; el máximo es ${PAGINACION.LIMITE_MAXIMO}`,
    orden: 'El criterio de orden no es válido',
  },
});
