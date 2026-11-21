import { api } from '../../shared/api/clienteHttp.js';

const datos = (promesa) => promesa.then((respuesta) => respuesta.data);

/** Devuelve la persona con el perfil ya actualizado. */
export const actualizarPerfil = (cuerpo) => datos(api.patch('/perfil', cuerpo));

export const cambiarContrasena = (cuerpo) => datos(api.put('/perfil/contrasena', cuerpo));
