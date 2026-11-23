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
    sesionCerrada: 'Tu sesión se cerró, por favor inicia sesión nuevamente',
    demasiadosIntentos: 'Demasiados intentos. Inténtalo más tarde.',
  },
  usuario: {
    nombre: `El nombre debe tener entre ${LIMITES.NOMBRE_USUARIO.min} y ${LIMITES.NOMBRE_USUARIO.max} caracteres`,
    correo: 'Ingresa un correo electrónico válido',
    contrasena: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número',
    contrasenaLarga: `La contraseña no puede superar ${LIMITES.CONTRASENA.max} caracteres`,
    contrasenaDistinta: 'Las contraseñas no coinciden',
  },
  auth: {
    credencialesInvalidas: 'Credenciales inválidas',
    correoRegistrado: 'Este correo ya se encuentra registrado',
    bloqueado: (minutos) =>
      `Demasiados intentos fallidos. Inténtalo nuevamente en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
    recuperacionSolicitada: 'Si el correo existe, recibirás un enlace de recuperación',
    enlaceExpirado: 'El enlace ha expirado',
    contrasenaRestablecida: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.',
    registroFallido: 'No pudimos completar tu registro. Inténtalo nuevamente',
    registroExitoso: 'Tu cuenta se creó correctamente. Ya puedes iniciar sesión.',
    contrasenaActualIncorrecta: 'La contraseña actual es incorrecta',
    contrasenaNuevaIgual: 'La nueva contraseña debe ser distinta de la actual',
    contrasenaCambiada: 'Tu contraseña se actualizó. Las demás sesiones se cerraron.',
  },
  admin: {
    ultimoAdministrador: 'Debe existir al menos un administrador',
    rolInvalido: 'Selecciona un rol válido',
    busquedaLarga: 'La búsqueda admite hasta 100 caracteres',
  },
  categoria: {
    nombreDuplicado: 'Ya existe una categoría con ese nombre',
    conMovimientos:
      'No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero',
    icono: 'Selecciona un ícono válido',
    tipoNoEditable: 'El tipo de una categoría no se puede cambiar',
    eliminada: 'La categoría se eliminó',
    creada: 'La categoría se creó',
    actualizada: 'La categoría se actualizó',
  },
  perfil: {
    actualizado: 'Tu perfil se actualizó',
    correoSoloLectura: 'El correo no se puede cambiar',
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
