// Representación JSON del usuario: nunca incluye el hash de la contraseña ni datos internos de bloqueo.

export function usuarioJson(usuario) {
  return {
    id: String(usuario.id ?? usuario._id),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    monedaPrincipal: usuario.monedaPrincipal,
    idioma: usuario.idioma ?? 'es',
    textoGrande: Boolean(usuario.textoGrande),
    altoContraste: Boolean(usuario.altoContraste),
  };
}

/** Vista para administración: agrega el estado y la fecha de alta, sin datos sensibles. */
export function usuarioAdminJson(usuario) {
  return {
    ...usuarioJson(usuario),
    activo: usuario.activo,
    creadoEn: usuario.createdAt,
  };
}
