import { api } from '../../shared/api/clienteHttp.js';

const datos = (promesa) => promesa.then((respuesta) => respuesta.data);

/** Devuelve la persona con el perfil ya actualizado. */
export const actualizarPerfil = (cuerpo) => datos(api.patch('/perfil', cuerpo));

/** Idioma y accesibilidad (HU-32, HU-33). Devuelve la persona actualizada. */
export const actualizarPreferencias = (cuerpo) => datos(api.patch('/perfil/preferencias', cuerpo));

export const cambiarContrasena = (cuerpo) => datos(api.put('/perfil/contrasena', cuerpo));
