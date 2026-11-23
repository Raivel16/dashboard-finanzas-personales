// Constantes compartidas entre cliente y servidor.

export const ROLES = Object.freeze({ USUARIO: 'usuario', ADMIN: 'admin' });
export const TIPOS_MOVIMIENTO = Object.freeze({ INGRESO: 'ingreso', GASTO: 'gasto' });
export const TIPOS_CUENTA = Object.freeze({
  EFECTIVO: 'efectivo',
  BANCO: 'banco',
  TARJETA_CREDITO: 'tarjeta_credito',
  BILLETERA_DIGITAL: 'billetera_digital',
});

// Ampliar la lista no requiere cambios de modelo (no hay conversión entre monedas).
export const MONEDAS = Object.freeze(['PEN', 'USD', 'EUR']);
export const MONEDA_PRINCIPAL_POR_DEFECTO = 'PEN';

export const ZONA_HORARIA_POR_DEFECTO = 'America/Lima';

export const PAGINACION = Object.freeze({ PAGINA: 1, LIMITE: 20, LIMITE_MAXIMO: 100 });

export const LIMITES = Object.freeze({
  NOMBRE_USUARIO: { min: 2, max: 80 },
  NOMBRE_CUENTA_CATEGORIA: { min: 2, max: 50 },
  CONTRASENA: { min: 8, max: 72 },
  CORREO_MAX: 254,
  DESCRIPCION_MAX: 255,
  MONTO_MAX: 999999999.99,
});

// Íconos permitidos para una categoría (HU-06): lista cerrada compartida por el servidor (valida) y el cliente (dibuja).
export const ICONOS_CATEGORIA = Object.freeze([
  'utensils', 'bus', 'house', 'heart-pulse', 'ticket', 'book-open', 'circle-ellipsis', 'wallet', 'store',
  'circle-plus', 'shopping-cart', 'car', 'plane', 'gift', 'shirt', 'smartphone', 'wifi', 'zap', 'droplet',
  'fuel', 'baby', 'dog', 'dumbbell', 'graduation-cap', 'briefcase', 'banknote', 'piggy-bank',
  'trending-up', 'coffee', 'gamepad-2', 'music', 'film',
]);
export const ICONO_CATEGORIA_POR_DEFECTO = 'circle-ellipsis';

// Categorías que recibe cada usuario al registrarse (HU-24). Son copias propias y editables.
export const CATEGORIAS_PREDETERMINADAS = Object.freeze([
  { tipo: 'gasto', nombre: 'Alimentación', icono: 'utensils' },
  { tipo: 'gasto', nombre: 'Transporte', icono: 'bus' },
  { tipo: 'gasto', nombre: 'Vivienda', icono: 'house' },
  { tipo: 'gasto', nombre: 'Salud', icono: 'heart-pulse' },
  { tipo: 'gasto', nombre: 'Entretenimiento', icono: 'ticket' },
  { tipo: 'gasto', nombre: 'Educación', icono: 'book-open' },
  { tipo: 'gasto', nombre: 'Otros gastos', icono: 'circle-ellipsis' },
  { tipo: 'ingreso', nombre: 'Sueldo', icono: 'wallet' },
  { tipo: 'ingreso', nombre: 'Ventas', icono: 'store' },
  { tipo: 'ingreso', nombre: 'Otros ingresos', icono: 'circle-plus' },
]);

// Códigos de error de la API (contrato-api).
export const CODIGOS_ERROR = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});
