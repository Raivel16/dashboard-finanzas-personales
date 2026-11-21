// Vista base: arma el cuerpo JSON del contrato de la API.
// Éxito: { data } o { data, meta }. Error: { error: { code, message, details } }.

export function cuerpoExito(data, meta) {
  return meta === undefined ? { data } : { data, meta };
}

export function metaPaginacion({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function cuerpoLista(items, paginacion) {
  return cuerpoExito(items, metaPaginacion(paginacion));
}

export function cuerpoError({ codigo, mensaje, detalles }) {
  const error = { code: codigo, message: mensaje };
  if (detalles !== undefined) error.details = detalles;
  return { error };
}
