// Plantillas de los correos de autenticación (texto y HTML). Solo construyen contenido; no envían nada.

const escapar = (texto) =>
  String(texto).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const envolver = (titulo, parrafos) =>
  `<div style="font-family:Arial,sans-serif;color:#14262E;max-width:480px">` +
  `<h2 style="color:#123F4A">${escapar(titulo)}</h2>${parrafos.join('')}</div>`;

export function correoBienvenida({ nombre, urlInicio }) {
  return {
    asunto: 'Bienvenido a Finanzas Personales',
    texto: `Hola ${nombre}, tu cuenta se creó correctamente. Ya puedes iniciar sesión: ${urlInicio}`,
    html: envolver('Bienvenido a Finanzas Personales', [
      `<p>Hola ${escapar(nombre)}, tu cuenta se creó correctamente.</p>`,
      `<p><a href="${escapar(urlInicio)}">Iniciar sesión</a></p>`,
    ]),
  };
}

export function correoRecuperacion({ nombre, enlace, minutos }) {
  return {
    asunto: 'Restablece tu contraseña',
    texto:
      `Hola ${nombre}, recibimos una solicitud para restablecer tu contraseña. ` +
      `Usa este enlace dentro de los próximos ${minutos} minutos: ${enlace}\n\n` +
      'Si no fuiste tú, ignora este correo: tu contraseña no cambiará.',
    html: envolver('Restablece tu contraseña', [
      `<p>Hola ${escapar(nombre)}, recibimos una solicitud para restablecer tu contraseña.</p>`,
      `<p><a href="${escapar(enlace)}">Crear una contraseña nueva</a></p>`,
      `<p>El enlace es de un solo uso y vence en ${minutos} minutos.</p>`,
      '<p>Si no fuiste tú, ignora este correo: tu contraseña no cambiará.</p>',
    ]),
  };
}

export function correoContrasenaActualizada({ nombre }) {
  return {
    asunto: 'Tu contraseña fue actualizada',
    texto:
      `Hola ${nombre}, tu contraseña se actualizó y se cerraron tus sesiones abiertas. ` +
      'Si no fuiste tú, restablécela de inmediato desde "¿Olvidaste tu contraseña?".',
    html: envolver('Tu contraseña fue actualizada', [
      `<p>Hola ${escapar(nombre)}, tu contraseña se actualizó y se cerraron tus sesiones abiertas.</p>`,
      '<p>Si no fuiste tú, restablécela de inmediato desde "¿Olvidaste tu contraseña?".</p>',
    ]),
  };
}
