// Esquemas de validación comunes ("Reglas de validación comunes", diseño sección 25).
import validator from 'validator';
import {
  ICONO_CATEGORIA_POR_DEFECTO,
  ICONOS_CATEGORIA,
  IDIOMAS,
  LIMITES,
  MONEDAS,
  PAGINACION,
  ROLES,
  TIPOS_CUENTA,
  TIPOS_MOVIMIENTO,
  ZONA_HORARIA_POR_DEFECTO,
} from './constantes.js';
import { MENSAJES } from './mensajes.js';

const recortar = (t) => t.trim();
const largo = (t, { min, max }) => t.length >= min && t.length <= max;

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria indicada. */
export function fechaHoy(zona = ZONA_HORARIA_POR_DEFECTO, ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

/** Normaliza un decimal ya validado a texto con 2 decimales ("15" -> "15.00"). */
export function normalizarMonto(texto) {
  const negativo = texto.startsWith('-');
  const [entero, decimales = ''] = texto.replace(/^[+-]/, '').split('.');
  const enteroLimpio = entero.replace(/^0+(?=\d)/, '') || '0';
  const resultado = `${enteroLimpio}.${decimales.padEnd(2, '0')}`;
  return negativo && Number(resultado) !== 0 ? `-${resultado}` : resultado;
}

const esDecimal = (t) => validator.isDecimal(t, { decimal_digits: '0,2', locale: 'en-US' });
const dentroDelMaximo = (t) => Math.abs(Number(t)) <= LIMITES.MONTO_MAX;
const esFecha = (t) => validator.isDate(t, { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] });

// ---- Reglas reutilizables ----

const nombreUsuario = {
  requerido: true,
  etiqueta: 'El nombre',
  sanear: recortar,
  reglas: [{ ok: (t) => largo(t, LIMITES.NOMBRE_USUARIO), mensaje: MENSAJES.usuario.nombre }],
};

const correoValido = {
  ok: (t) => t.length <= LIMITES.CORREO_MAX && validator.isEmail(t),
  mensaje: MENSAJES.usuario.correo,
};

const correo = {
  requerido: true,
  etiqueta: 'El correo electrónico',
  sanear: (t) => recortar(t).toLowerCase(),
  reglas: [correoValido],
};

const contrasena = {
  requerido: true,
  etiqueta: 'La contraseña',
  reglas: [
    {
      // Se mide en bytes UTF-8: bcrypt ignora lo que exceda de 72 bytes.
      ok: (t) => new TextEncoder().encode(t).length <= LIMITES.CONTRASENA.max,
      mensaje: MENSAJES.usuario.contrasenaLarga,
    },
    {
      ok: (t) =>
        t.length >= LIMITES.CONTRASENA.min &&
        validator.isStrongPassword(t, {
          minLength: LIMITES.CONTRASENA.min,
          minLowercase: 0,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 0,
        }),
      mensaje: MENSAJES.usuario.contrasena,
    },
  ],
};

const nombreCuentaCategoria = {
  requerido: true,
  etiqueta: 'El nombre',
  sanear: recortar,
  reglas: [{ ok: (t) => largo(t, LIMITES.NOMBRE_CUENTA_CATEGORIA), mensaje: MENSAJES.nombreCuentaCategoria }],
};

const monedaRegla = (obligatoria = true) => ({
  requerido: obligatoria,
  etiqueta: 'La moneda',
  mensajeRequerido: MENSAJES.moneda,
  sanear: (t) => recortar(t).toUpperCase(),
  reglas: [{ ok: (t) => MONEDAS.includes(t), mensaje: MENSAJES.moneda }],
});

const idRegla = (etiqueta, obligatorio = true) => ({
  requerido: obligatorio,
  etiqueta,
  sanear: recortar,
  reglas: [{ ok: (t) => validator.isUUID(t, 4), mensaje: MENSAJES.id }],
});

const tipoMovimientoRegla = {
  requerido: true,
  etiqueta: 'El tipo de movimiento',
  mensajeRequerido: MENSAJES.tipoMovimiento,
  sanear: recortar,
  reglas: [{ ok: (t) => Object.values(TIPOS_MOVIMIENTO).includes(t), mensaje: MENSAJES.tipoMovimiento }],
};

const montoPositivo = {
  requerido: true,
  etiqueta: 'El monto',
  sanear: recortar,
  reglas: [
    { ok: (t) => esDecimal(t) && Number(t) > 0, mensaje: MENSAJES.monto.positivo },
    { ok: dentroDelMaximo, mensaje: MENSAJES.monto.maximo },
  ],
  convertir: normalizarMonto,
};

const fechaFormato = { ok: esFecha, mensaje: MENSAJES.fecha.formato };

// ---- Esquemas ----

const idiomaRegla = {
  etiqueta: 'El idioma',
  sanear: recortar,
  reglas: [{ ok: (t) => Object.values(IDIOMAS).includes(t), mensaje: MENSAJES.idioma }],
};

const booleanoRegla = (etiqueta) => ({
  etiqueta,
  reglas: [{ ok: (t) => t === 'true' || t === 'false', mensaje: MENSAJES.generales.invalido(etiqueta) }],
  convertir: (t) => t === 'true',
});

export const esquemaRegistro = {
  nombre: nombreUsuario,
  email: correo,
  password: contrasena,
  // Idioma en que se registra: define el de la aplicación y el de las categorías predeterminadas (HU-32).
  idioma: { ...idiomaRegla, porDefecto: IDIOMAS.ES },
};

export const esquemaInicioSesion = {
  email: { ...correo },
  password: { requerido: true, etiqueta: 'La contraseña' },
};

export const esquemaOlvideContrasena = { email: { ...correo } };

export const esquemaRestablecerContrasena = {
  token: { requerido: true, etiqueta: 'El enlace', sanear: recortar },
  password: contrasena,
};

export const esquemaActualizarPerfil = {
  nombre: nombreUsuario,
  monedaPrincipal: monedaRegla(false),
};

/** Preferencias de idioma y accesibilidad (HU-32, HU-33). Todas opcionales; el servicio exige al menos una. */
export const esquemaPreferencias = {
  idioma: idiomaRegla,
  textoGrande: booleanoRegla('Texto grande'),
  altoContraste: booleanoRegla('Alto contraste'),
};

export const esquemaCambiarContrasena = {
  // La actual no se valida como contraseña nueva: solo debe venir.
  passwordActual: { requerido: true, etiqueta: 'La contraseña actual' },
  passwordNueva: { ...contrasena, etiqueta: 'La contraseña nueva' },
};

const nombreCuenta = {
  ...nombreCuentaCategoria,
  mensajeRequerido: MENSAJES.cuenta.nombreObligatorio,
};

const monedaCuenta = (obligatoria = true) => ({
  ...monedaRegla(obligatoria),
  mensajeRequerido: MENSAJES.cuenta.monedaObligatoria,
});

const saldoInicialRegla = {
  etiqueta: 'El saldo inicial',
  sanear: recortar,
  reglas: [
    { ok: esDecimal, mensaje: MENSAJES.monto.saldo },
    { ok: dentroDelMaximo, mensaje: MENSAJES.monto.maximo },
  ],
  convertir: normalizarMonto,
};

const tipoCuentaRegla = {
  requerido: true,
  etiqueta: 'El tipo de cuenta',
  mensajeRequerido: MENSAJES.tipoCuenta,
  sanear: recortar,
  reglas: [{ ok: (t) => Object.values(TIPOS_CUENTA).includes(t), mensaje: MENSAJES.tipoCuenta }],
};

export const esquemaCuenta = {
  nombre: nombreCuenta,
  tipo: tipoCuentaRegla,
  moneda: monedaCuenta(),
  saldoInicial: { ...saldoInicialRegla, porDefecto: '0.00' },
};

/** Edición: cualquier campo es opcional; el servicio exige al menos uno. */
export const esquemaActualizarCuenta = {
  nombre: { ...nombreCuenta, requerido: false },
  tipo: { ...tipoCuentaRegla, requerido: false },
  moneda: monedaCuenta(false),
  saldoInicial: saldoInicialRegla,
};

export const esquemaCategoria = {
  nombre: nombreCuentaCategoria,
  tipo: { ...tipoMovimientoRegla, etiqueta: 'El tipo' },
  icono: {
    sanear: recortar,
    porDefecto: ICONO_CATEGORIA_POR_DEFECTO,
    reglas: [{ ok: (t) => ICONOS_CATEGORIA.includes(t), mensaje: MENSAJES.categoria.icono }],
  },
};

/** Edición: solo nombre e ícono; el tipo no cambia (un movimiento no puede quedar en una categoría del otro tipo). */
export const esquemaActualizarCategoria = {
  nombre: { ...nombreCuentaCategoria, requerido: false },
  icono: { ...esquemaCategoria.icono, porDefecto: undefined },
  tipo: {
    sanear: recortar,
    reglas: [{ ok: () => false, mensaje: MENSAJES.categoria.tipoNoEditable }],
  },
};

/** El esquema del movimiento depende de "hoy" (no se admiten fechas futuras). */
export function crearEsquemaMovimiento({ hoy = fechaHoy() } = {}) {
  return {
    tipo: tipoMovimientoRegla,
    monto: montoPositivo,
    fecha: {
      requerido: true,
      etiqueta: 'La fecha',
      mensajeRequerido: MENSAJES.fecha.obligatoria,
      sanear: recortar,
      reglas: [fechaFormato, { ok: (t) => t <= hoy, mensaje: MENSAJES.fecha.futura }],
    },
    categoriaId: { ...idRegla('La categoría'), mensajeRequerido: MENSAJES.movimiento.categoriaObligatoria },
    cuentaId: { ...idRegla('La cuenta'), mensajeRequerido: MENSAJES.movimiento.cuentaObligatoria },
    descripcion: {
      sanear: recortar,
      reglas: [{ ok: (t) => t.length <= LIMITES.DESCRIPCION_MAX, mensaje: MENSAJES.descripcion }],
    },
  };
}

const periodoRegla = (obligatorio = true) => ({
  requerido: obligatorio,
  etiqueta: 'El período',
  sanear: recortar,
  reglas: [{ ok: (t) => /^\d{4}-(0[1-9]|1[0-2])$/.test(t), mensaje: MENSAJES.periodo }],
});

export const esquemaPresupuesto = {
  periodo: periodoRegla(),
  moneda: monedaRegla(),
  categoriaId: idRegla('La categoría', false),
  monto: {
    ...montoPositivo,
    mensajeRequerido: MENSAJES.presupuesto.montoInvalido,
    reglas: [
      { ok: (t) => esDecimal(t) && Number(t) > 0, mensaje: MENSAJES.presupuesto.montoInvalido },
      { ok: dentroDelMaximo, mensaje: MENSAJES.monto.maximo },
    ],
  },
};

/** Cuerpo de PUT /presupuestos/:id: solo cambia el monto. */
export const esquemaReemplazarPresupuesto = { monto: esquemaPresupuesto.monto };

/** Seguimiento de presupuestos: mes (por defecto el actual) y moneda opcionales. */
export const esquemaSeguimientoPresupuestos = {
  periodo: periodoRegla(false),
  moneda: monedaRegla(false),
};

// ---- Consultas: paginación, orden y filtros (query string) ----

const enteroPositivo = (t) => validator.isInt(t, { min: 1, allow_leading_zeroes: false });

export const esquemaPaginacion = {
  page: {
    sanear: recortar,
    porDefecto: PAGINACION.PAGINA,
    reglas: [{ ok: enteroPositivo, mensaje: MENSAJES.paginacion.pagina }],
    convertir: Number,
  },
  limit: {
    sanear: recortar,
    porDefecto: PAGINACION.LIMITE,
    reglas: [
      {
        ok: (t) => enteroPositivo(t) && Number(t) <= PAGINACION.LIMITE_MAXIMO,
        mensaje: MENSAJES.paginacion.limite,
      },
    ],
    convertir: Number,
  },
};

/** sort acepta un campo permitido, con "-" delante para orden descendente. */
export function crearEsquemaOrden(permitidos, porDefecto) {
  const validos = permitidos.flatMap((c) => [c, `-${c}`]);
  return {
    sort: {
      sanear: recortar,
      porDefecto,
      reglas: [{ ok: (t) => validos.includes(t), mensaje: MENSAJES.paginacion.orden }],
    },
  };
}

/** Esquema de la consulta del historial de movimientos (HU-10, HU-11). */
export const esquemaConsultaMovimientos = {
  ...esquemaPaginacion,
  ...crearEsquemaOrden(['fecha', 'monto'], '-fecha'),
  desde: { etiqueta: 'desde', sanear: recortar, reglas: [fechaFormato] },
  hasta: {
    etiqueta: 'hasta',
    sanear: recortar,
    reglas: [
      fechaFormato,
      { ok: (t, datos) => !datos.desde || datos.desde <= t, mensaje: MENSAJES.fecha.rango },
    ],
  },
  tipo: {
    sanear: recortar,
    reglas: [{ ok: (t) => Object.values(TIPOS_MOVIMIENTO).includes(t), mensaje: MENSAJES.tipoMovimiento }],
  },
  categoriaId: idRegla('La categoría', false),
  cuentaId: idRegla('La cuenta', false),
  moneda: monedaRegla(false),
};

/** Filtros del reporte exportable: los mismos del historial, sin paginación ni orden. */
export const esquemaConsultaReporte = (({ desde, hasta, tipo, categoriaId, cuentaId, moneda }) => ({
  desde,
  hasta,
  tipo,
  categoriaId,
  cuentaId,
  moneda,
}))(esquemaConsultaMovimientos);

/** Consulta del dashboard (indicadores y gráficos): mes (por defecto el actual) y moneda (por defecto la principal). */
export const esquemaConsultaDashboard = esquemaSeguimientoPresupuestos;

/** Listado de presupuestos: paginación, orden por mes y filtros por mes y moneda. */
export const esquemaConsultaPresupuestos = {
  ...esquemaPaginacion,
  ...crearEsquemaOrden(['periodo', 'monto'], '-periodo'),
  ...esquemaSeguimientoPresupuestos,
};

// ---- Administración (HU-22, HU-23) ----

export const esquemaCambiarRol = {
  rol: {
    requerido: true,
    etiqueta: 'El rol',
    mensajeRequerido: MENSAJES.admin.rolInvalido,
    sanear: recortar,
    reglas: [{ ok: (t) => Object.values(ROLES).includes(t), mensaje: MENSAJES.admin.rolInvalido }],
  },
};

/** Listado de usuarios: paginación, orden y búsqueda por nombre o correo. */
export const esquemaConsultaUsuarios = {
  ...esquemaPaginacion,
  ...crearEsquemaOrden(['nombre', 'email', 'createdAt'], 'nombre'),
  q: {
    etiqueta: 'La búsqueda',
    sanear: recortar,
    reglas: [{ ok: (t) => t.length <= 100, mensaje: MENSAJES.admin.busquedaLarga }],
  },
};

/** Listado de categorías: paginación, orden y filtro opcional por tipo. */
export const esquemaConsultaCategorias = {
  ...esquemaPaginacion,
  ...crearEsquemaOrden(['nombre', 'tipo'], 'tipo'),
  tipo: {
    sanear: recortar,
    reglas: [{ ok: (t) => Object.values(TIPOS_MOVIMIENTO).includes(t), mensaje: MENSAJES.tipoMovimiento }],
  },
};

/** Listado de cuentas: paginación, orden por nombre y filtros opcionales por tipo y moneda. */
export const esquemaConsultaCuentas = {
  ...esquemaPaginacion,
  ...crearEsquemaOrden(['nombre', 'saldoActual'], 'nombre'),
  tipo: {
    sanear: recortar,
    reglas: [{ ok: (t) => Object.values(TIPOS_CUENTA).includes(t), mensaje: MENSAJES.tipoCuenta }],
  },
  moneda: {
    sanear: (t) => recortar(t).toUpperCase(),
    reglas: [{ ok: (t) => MONEDAS.includes(t), mensaje: MENSAJES.moneda }],
  },
};
