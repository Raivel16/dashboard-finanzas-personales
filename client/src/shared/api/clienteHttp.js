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

/**
 * @returns {Promise<{ data: any, meta: object | null }>}
 * @throws {ErrorApi}
 */
export async function solicitar(ruta, { metodo = 'GET', cuerpo, consulta, signal, fetchImpl = fetch } = {}) {
  let respuesta;
  try {
    respuesta = await fetchImpl(construirUrl(ruta, consulta), {
      method: metodo,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ErrorApi({ estado: 0, codigo: 'NETWORK_ERROR', mensaje: MENSAJE_RED });
  }

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

export const api = {
  get: (ruta, opciones) => solicitar(ruta, { ...opciones, metodo: 'GET' }),
  post: (ruta, cuerpo, opciones) => solicitar(ruta, { ...opciones, metodo: 'POST', cuerpo }),
  put: (ruta, cuerpo, opciones) => solicitar(ruta, { ...opciones, metodo: 'PUT', cuerpo }),
  patch: (ruta, cuerpo, opciones) => solicitar(ruta, { ...opciones, metodo: 'PATCH', cuerpo }),
  delete: (ruta, opciones) => solicitar(ruta, { ...opciones, metodo: 'DELETE' }),
};
