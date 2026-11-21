// Lectura y validación de las variables de entorno. Nunca incluye valores en los mensajes de error.
import { existsSync } from 'node:fs';
import { validar, ZONA_HORARIA_POR_DEFECTO } from '@finanzas/shared';
import { ConfigurationError } from '../utils/errores.js';

const recortar = (t) => t.trim();
const requerida = (nombre, reglas = []) => ({
  requerido: true,
  mensajeRequerido: `Falta la variable de entorno ${nombre}`,
  sanear: recortar,
  reglas,
});
const entero = (nombre, min, max) => ({
  ok: (t) => /^\d+$/.test(t) && Number(t) >= min && Number(t) <= max,
  mensaje: `${nombre} debe ser un entero entre ${min} y ${max}`,
});
const conDefecto = (nombre, porDefecto, min, max) => ({
  sanear: recortar,
  porDefecto,
  reglas: [entero(nombre, min, max)],
  convertir: Number,
});
const esUrl = (t) => {
  try {
    return ['http:', 'https:'].includes(new URL(t).protocol);
  } catch {
    return false;
  }
};
const zonaValida = (t) => {
  try {
    new Intl.DateTimeFormat('es', { timeZone: t });
    return true;
  } catch {
    return false;
  }
};

export const esquemaEntorno = {
  NODE_ENV: {
    sanear: recortar,
    porDefecto: 'development',
    reglas: [
      {
        ok: (t) => ['development', 'test', 'production'].includes(t),
        mensaje: 'NODE_ENV debe ser development, test o production',
      },
    ],
  },
  PORT: conDefecto('PORT', 3000, 1, 65535),
  MONGODB_URI: requerida('MONGODB_URI', [
    {
      ok: (t) => /^mongodb(\+srv)?:\/\//.test(t),
      mensaje: 'MONGODB_URI debe empezar con mongodb:// o mongodb+srv://',
    },
  ]),
  CLIENT_URL: requerida('CLIENT_URL', [{ ok: esUrl, mensaje: 'CLIENT_URL debe ser una URL http(s) válida' }]),
  JWT_ACCESS_SECRET: requerida('JWT_ACCESS_SECRET', [
    { ok: (t) => t.length >= 32, mensaje: 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres' },
  ]),
  JWT_ACCESS_TTL: {
    sanear: recortar,
    porDefecto: '15m',
    reglas: [
      { ok: (t) => /^\d+[smhd]$/.test(t), mensaje: 'JWT_ACCESS_TTL debe tener el formato 15m, 1h, 7d…' },
    ],
  },
  REFRESH_INACTIVITY_MIN: conDefecto('REFRESH_INACTIVITY_MIN', 30, 1, 1440),
  REFRESH_ABSOLUTE_DAYS: conDefecto('REFRESH_ABSOLUTE_DAYS', 7, 1, 90),
  RESET_TOKEN_TTL_MIN: conDefecto('RESET_TOKEN_TTL_MIN', 30, 1, 1440),
  APP_TIMEZONE: {
    sanear: recortar,
    porDefecto: ZONA_HORARIA_POR_DEFECTO,
    reglas: [{ ok: zonaValida, mensaje: 'APP_TIMEZONE no es una zona horaria válida' }],
  },
  SMTP_HOST: { sanear: recortar },
  SMTP_PORT: conDefecto('SMTP_PORT', 587, 1, 65535),
  SMTP_USER: { sanear: recortar },
  SMTP_PASS: { sanear: (t) => t },
  MAIL_FROM: { sanear: recortar },
};

/**
 * Valida las variables y devuelve la configuración tipada.
 * @throws {ConfigurationError} con la lista de variables faltantes o inválidas (sin sus valores).
 */
export function leerEntorno(env = process.env) {
  const r = validar(esquemaEntorno, env);
  const problemas = r.errores.map((e) => e.mensaje);
  const d = r.datos;

  if (d.NODE_ENV === 'production' && !d.SMTP_HOST) {
    problemas.push('Falta la variable de entorno SMTP_HOST (obligatoria en producción)');
  }

  if (d.SMTP_HOST) {
    for (const nombre of ['SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']) {
      if (!d[nombre])
        problemas.push(`Falta la variable de entorno ${nombre} (obligatoria cuando se define SMTP_HOST)`);
    }
  }

  if (problemas.length > 0) {
    throw new ConfigurationError(
      `Configuración incompleta o inválida:\n- ${problemas.join('\n- ')}\nRevisa server/.env (hay una plantilla en server/.env.example).`,
      problemas,
    );
  }

  return Object.freeze({
    entorno: d.NODE_ENV,
    esProduccion: d.NODE_ENV === 'production',
    puerto: d.PORT,
    mongodbUri: d.MONGODB_URI,
    clientUrl: d.CLIENT_URL,
    jwt: Object.freeze({ secreto: d.JWT_ACCESS_SECRET, ttl: d.JWT_ACCESS_TTL }),
    sesion: Object.freeze({
      inactividadMin: d.REFRESH_INACTIVITY_MIN,
      absolutaDias: d.REFRESH_ABSOLUTE_DAYS,
    }),
    resetTokenTtlMin: d.RESET_TOKEN_TTL_MIN,
    zonaHoraria: d.APP_TIMEZONE,
    smtp: d.SMTP_HOST
      ? Object.freeze({ host: d.SMTP_HOST, puerto: d.SMTP_PORT, usuario: d.SMTP_USER, clave: d.SMTP_PASS })
      : null,
    correoRemitente: d.MAIL_FROM || null,
  });
}

/** Carga un archivo .env si existe (sin pisar variables ya definidas en el entorno). */
export function cargarArchivoEnv(ruta) {
  if (existsSync(ruta)) process.loadEnvFile(ruta);
}
