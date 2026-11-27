// Único cliente HTTP de la aplicación. Interpreta { data, meta } y { error: { code, message, details } }
// del contrato de la API, y convierte cualquier falla en un ErrorApi con mensaje en español.
const BASE = '/api/v1';

export class ErrorApi extends Error {
  constructor({ estado, codigo, mensaje, detalles }) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  /** Mensaje de un campo concreto (errores VALIDATION_ERROR), o undefined. */
  mensajeDe(campo) {
    return Array.isArray(this.detalles) ? this.detalles.find((d) => d.campo === campo)?.mensaje : undefined;
  }
}

const MENSAJE_RED = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Inténtalo nuevamente.';

function construirUrl(ruta, consulta) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(consulta ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, String(valor));
  }
  const texto = parametros.toString();
  return `${BASE}${ruta}${texto ? `?${texto}` : ''}`;
}

async function ejecutar(
  ruta,
  { metodo = 'GET', cuerpo, consulta, signal, binario = false, fetchImpl = fetch } = {},
) {
  let respuesta;
  try {
    respuesta = await fetchImpl(construirUrl(ruta, consulta), {
      method: metodo,
      credentials: 'include',
      headers: {
        Accept: binario ? '*/*' : 'application/json',
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ErrorApi({ estado: 0, codigo: 'NETWORK_ERROR', mensaje: MENSAJE_RED });
  }

  if (binario && respuesta.ok) return leerArchivo(respuesta);

  const texto = await respuesta.text();
  let json = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null; // respuesta que no es JSON (p. ej. una página de error del proxy)
  }

  if (!respuesta.ok) {
    throw new ErrorApi({
      estado: respuesta.status,
      codigo: json?.error?.code ?? 'INTERNAL_ERROR',
      mensaje: json?.error?.message ?? MENSAJE_GENERICO,
      detalles: json?.error?.details,
    });
  }
  return { data: json?.data ?? null, meta: json?.meta ?? null };
}

/** Cuerpo de una descarga: { data: Blob, meta: { nombre } }. Si la conexión se corta a medias no devuelve nada. */
async function leerArchivo(respuesta) {
  try {
    const nombre =
      /filename="?([^";]+)"?/.exec(respuesta.headers?.get?.('Content-Disposition') ?? '')?.[1] ?? 'reporte';
    return { data: await respuesta.blob(), meta: { nombre } };
  } catch {
    throw new ErrorApi({ estado: 0, codigo: 'NETWORK_ERROR', mensaje: MENSAJE_RED });
  }
}

// --- Sesión: renovación automática del token de acceso (HU-19) ---------------------------------------
// El cliente no sabe de autenticación: quien la conozca llama a configurarSesionHttp con dos funciones.

const CODIGOS_FIN_SESION = new Set(['SESSION_EXPIRED', 'SESSION_REVOKED']);
let configuracionSesion = { renovar: null, alSesionTerminada: null };
let renovando = null;

/**
 * @param {{ renovar?: () => Promise<void>, alSesionTerminada?: (error: ErrorApi) => void }} [configuracion]
 *   `renovar` pide un token nuevo; `alSesionTerminada` se llama cuando la sesión ya no se puede continuar.
 */
export function configurarSesionHttp({ renovar = null, alSesionTerminada = null } = {}) {
  configuracionSesion = { renovar, alSesionTerminada };
  renovando = null;
}

/** Varias solicitudes que vencen a la vez comparten una sola renovación. */
function renovarUnaVez() {
  renovando ??= Promise.resolve()
    .then(() => configuracionSesion.renovar())
    .finally(() => {
      renovando = null;
    });
  return renovando;
}

const terminaLaSesion = (error) =>
  error instanceof ErrorApi && (CODIGOS_FIN_SESION.has(error.codigo) || error.estado === 401);

/**
 * @param {string} ruta
 * @param {object} [opciones]  `sinRenovar: true` evita el ciclo de renovación (login, refresh, logout).
 * @returns {Promise<{ data: any, meta: object | null }>}
 * @throws {ErrorApi}
 */
export async function solicitar(ruta, opciones = {}) {
  const { sinRenovar, ...paraEjecutar } = opciones;
  try {
    return await ejecutar(ruta, paraEjecutar);
  } catch (error) {
    if (sinRenovar || !(error instanceof ErrorApi)) throw error;

    if (error.codigo === 'TOKEN_EXPIRED' && configuracionSesion.renovar) {
      try {
        await renovarUnaVez();
      } catch (falla) {
        if (terminaLaSesion(falla)) configuracionSesion.alSesionTerminada?.(falla);
        throw falla instanceof ErrorApi ? falla : error;
      }
      try {
        return await ejecutar(ruta, paraEjecutar); // un solo reintento: nunca hay bucle
      } catch (segundo) {
        if (segundo instanceof ErrorApi && CODIGOS_FIN_SESION.has(segundo.codigo)) {
          configuracionSesion.alSesionTerminada?.(segundo);
        }
        throw segundo;
      }
    }

    if (CODIGOS_FIN_SESION.has(error.codigo)) configuracionSesion.alSesionTerminada?.(error);
    throw error;
  }
}

export const api = {
  get: (ruta, opciones) => solicitar(ruta, { ...opciones, metodo: 'GET' }),
  /** Descarga un archivo: { data: Blob, meta: { nombre } }. Los errores llegan como ErrorApi, nunca como archivo. */
  descargar: (ruta, opciones) => solicitar(ruta, { ...opciones, metodo: 'GET', binario: true }),
  post: (ruta, cuerpo, opciones) => solicitar(ruta, { ...opciones, metodo: 'POST', cuerpo }),
  put: (ruta, cuerpo, opciones) => solicitar(ruta, { ...opciones, metodo: 'PUT', cuerpo }),
  patch: (ruta, cuerpo, opciones) => solicitar(ruta, { ...opciones, metodo: 'PATCH', cuerpo }),
  delete: (ruta, opciones) => solicitar(ruta, { ...opciones, metodo: 'DELETE' }),
};
