// Representación JSON de una categoría.
export function categoriaJson(categoria) {
  return {
    id: String(categoria.id ?? categoria._id),
    nombre: categoria.nombre,
    tipo: categoria.tipo,
    icono: categoria.icono,
    creadaEn: categoria.createdAt,
    actualizadaEn: categoria.updatedAt,
  };
}
