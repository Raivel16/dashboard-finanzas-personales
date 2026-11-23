// Capa HTTP de las categorías. Nunca toca modelos ni repositorios.
import { cuerpoExito, cuerpoLista } from '../views/respuesta.view.js';
import { categoriaJson } from '../views/categoria.view.js';

export function crearCategoriaController({ categorias }) {
  return {
    async listar(req, res) {
      const { items, total } = await categorias.listar(req.usuario, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(categoriaJson), { page, limit, total }));
    },

    async crear(req, res) {
      const categoria = await categorias.crear(req.usuario, req.datos);
      res.status(201).json(cuerpoExito(categoriaJson(categoria)));
    },

    async actualizar(req, res) {
      const categoria = await categorias.actualizar(req.usuario, req.params.id, req.datos);
      res.json(cuerpoExito(categoriaJson(categoria)));
    },

    async eliminar(req, res) {
      await categorias.eliminar(req.usuario, req.params.id);
      res.status(204).end();
    },

    /** Lectura de administrador: GET /admin/usuarios/:id/categorias. */
    async listarDeUsuario(req, res) {
      const { items, total } = await categorias.listarDeUsuario(req.usuario, req.params.id, req.consulta);
      const { page, limit } = req.consulta;
      res.json(cuerpoLista(items.map(categoriaJson), { page, limit, total }));
    },
  };
}
