import { api } from '../../shared/api/clienteHttp.js';

// Estas llamadas no renuevan la sesión por su cuenta: son las que definen si hay sesión o no.
const SIN_RENOVAR = { sinRenovar: true };

const datos = (promesa) => promesa.then((respuesta) => respuesta.data);

export const registrar = (cuerpo) => datos(api.post('/auth/registro', cuerpo, SIN_RENOVAR));
export const iniciarSesion = (cuerpo) => datos(api.post('/auth/login', cuerpo, SIN_RENOVAR));
export const renovarSesion = () => datos(api.post('/auth/refresh', undefined, SIN_RENOVAR));
export const cerrarSesion = () => datos(api.post('/auth/logout', undefined, SIN_RENOVAR));
/** Usa el cliente completo: si el token de acceso venció, se renueva y se repite. */
export const obtenerSesion = () => datos(api.get('/auth/me'));
export const solicitarRecuperacion = (cuerpo) =>
  datos(api.post('/auth/olvide-contrasena', cuerpo, SIN_RENOVAR));
export const restablecerContrasena = (cuerpo) =>
  datos(api.post('/auth/restablecer-contrasena', cuerpo, SIN_RENOVAR));
