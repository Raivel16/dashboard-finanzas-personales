// Idioma de cada respuesta de la API (HU-32): el del usuario autenticado o, sin sesión, el del navegador.
import { idiomaDe, traducirMensaje } from '@finanzas/shared';

/** Idioma de la solicitud. Se calcula al responder, cuando la autenticación ya dejó el usuario en `req`. */
export const idiomaDeSolicitud = (req) => req.usuario?.idioma ?? idiomaDe(req.get('Accept-Language'));

/** Traduce los textos del contrato de la API: mensaje y detalles del error, `data.mensaje` y las advertencias. */
export function traducirCuerpo(cuerpo, idioma) {
  if (!cuerpo || typeof cuerpo !== 'object' || idioma === 'es') return cuerpo;
  const t = (texto) => traducirMensaje(texto, idioma);
  const salida = { ...cuerpo };
  if (cuerpo.error) {
    salida.error = { ...cuerpo.error, message: t(cuerpo.error.message) };
    if (Array.isArray(cuerpo.error.details)) {
      salida.error.details = cuerpo.error.details.map((d) =>
        d?.mensaje ? { ...d, mensaje: t(d.mensaje) } : d,
      );
    }
  }
  if (typeof cuerpo.data?.mensaje === 'string')
    salida.data = { ...cuerpo.data, mensaje: t(cuerpo.data.mensaje) };
  if (Array.isArray(cuerpo.meta?.advertencias)) {
    salida.meta = { ...cuerpo.meta, advertencias: cuerpo.meta.advertencias.map(t) };
  }
  return salida;
}

export function idiomaDeRespuesta(req, res, next) {
  const json = res.json.bind(res);
  res.json = (cuerpo) => json(traducirCuerpo(cuerpo, idiomaDeSolicitud(req)));
  next();
}
