// Plantillas de los correos de autenticación (texto y HTML) en el idioma de la persona destinataria (HU-32).
// Solo construyen contenido; no envían nada.

const escapar = (texto) =>
  String(texto).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const envolver = (titulo, parrafos) =>
  `<div style="font-family:Arial,sans-serif;color:#14262E;max-width:480px">` +
  `<h2 style="color:#123F4A">${escapar(titulo)}</h2>${parrafos.join('')}</div>`;

const TEXTOS = {
  es: {
    bienvenida: {
      asunto: 'Bienvenido a Finanzas Personales',
      saludo: (nombre) => `Hola ${nombre}, tu cuenta se creó correctamente.`,
      ingresar: 'Ya puedes iniciar sesión',
      boton: 'Iniciar sesión',
    },
    recuperacion: {
      asunto: 'Restablece tu contraseña',
      saludo: (nombre) => `Hola ${nombre}, recibimos una solicitud para restablecer tu contraseña.`,
      plazo: (minutos) => `Usa este enlace dentro de los próximos ${minutos} minutos`,
      boton: 'Crear una contraseña nueva',
      vence: (minutos) => `El enlace es de un solo uso y vence en ${minutos} minutos.`,
      ignorar: 'Si no fuiste tú, ignora este correo: tu contraseña no cambiará.',
    },
    actualizada: {
      asunto: 'Tu contraseña fue actualizada',
      saludo: (nombre, conservaSesion) =>
        `Hola ${nombre}, tu contraseña se actualizó y se cerraron ${
          conservaSesion ? 'tus otras sesiones abiertas' : 'tus sesiones abiertas'
        }.`,
      aviso: 'Si no fuiste tú, restablécela de inmediato desde "¿Olvidaste tu contraseña?".',
    },
  },
  en: {
    bienvenida: {
      asunto: 'Welcome to Personal Finances',
      saludo: (nombre) => `Hi ${nombre}, your account was created.`,
      ingresar: 'You can now sign in',
      boton: 'Sign in',
    },
    recuperacion: {
      asunto: 'Reset your password',
      saludo: (nombre) => `Hi ${nombre}, we received a request to reset your password.`,
      plazo: (minutos) => `Use this link within the next ${minutos} minutes`,
      boton: 'Create a new password',
      vence: (minutos) => `The link can be used once and expires in ${minutos} minutes.`,
      ignorar: 'If it was not you, ignore this email: your password will not change.',
    },
    actualizada: {
      asunto: 'Your password was updated',
      saludo: (nombre, conservaSesion) =>
        `Hi ${nombre}, your password was updated and ${
          conservaSesion ? 'your other open sessions were' : 'your open sessions were'
        } closed.`,
      aviso: 'If it was not you, reset it right away from "Forgot your password?".',
    },
  },
};

const textos = (idioma) => TEXTOS[idioma] ?? TEXTOS.es;

export function correoBienvenida({ nombre, urlInicio, idioma }) {
  const t = textos(idioma).bienvenida;
  return {
    asunto: t.asunto,
    texto: `${t.saludo(nombre)} ${t.ingresar}: ${urlInicio}`,
    html: envolver(t.asunto, [
      `<p>${escapar(t.saludo(nombre))}</p>`,
      `<p><a href="${escapar(urlInicio)}">${escapar(t.boton)}</a></p>`,
    ]),
  };
}

export function correoRecuperacion({ nombre, enlace, minutos, idioma }) {
  const t = textos(idioma).recuperacion;
  return {
    asunto: t.asunto,
    texto: `${t.saludo(nombre)} ${t.plazo(minutos)}: ${enlace}\n\n${t.ignorar}`,
    html: envolver(t.asunto, [
      `<p>${escapar(t.saludo(nombre))}</p>`,
      `<p><a href="${escapar(enlace)}">${escapar(t.boton)}</a></p>`,
      `<p>${escapar(t.vence(minutos))}</p>`,
      `<p>${escapar(t.ignorar)}</p>`,
    ]),
  };
}

export function correoContrasenaActualizada({ nombre, conservaSesion = false, idioma }) {
  const t = textos(idioma).actualizada;
  return {
    asunto: t.asunto,
    texto: `${t.saludo(nombre, conservaSesion)} ${t.aviso}`,
    html: envolver(t.asunto, [
      `<p>${escapar(t.saludo(nombre, conservaSesion))}</p>`,
      `<p>${escapar(t.aviso)}</p>`,
    ]),
  };
}
