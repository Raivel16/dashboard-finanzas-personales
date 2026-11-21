// Representación JSON del usuario: nunca incluye el hash de la contraseña ni datos internos de bloqueo.

export function usuarioJson(usuario) {
  return {
    id: String(usuario.id ?? usuario._id),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    monedaPrincipal: usuario.monedaPrincipal,
  };
}
