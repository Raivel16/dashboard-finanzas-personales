// Categorías propias (HU-06). El inquilino y el creador salen siempre de la sesión, nunca del cuerpo.
import mongoose from 'mongoose';
import { MENSAJES } from '@finanzas/shared';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errores.js';
import {
  INTERCALACION,
  ModeloCategoria,
  categoriaRepository,
  ordenCategorias,
} from '../repositories/categoria.repository.js';

const esDuplicado = (error) => error?.code === 11000;
const duplicada = () => new ConflictError(MENSAJES.categoria.nombreDuplicado);

export function crearCategoriaService({ admin, logger }) {
  return {
    async listar(actor, { tipo, ...paginacion }) {
      return categoriaRepository(actor.tenantId).listarOrdenadas(tipo ? { tipo } : {}, paginacion);
    },

    async crear(actor, { nombre, tipo, icono }) {
      try {
        return await categoriaRepository(actor.tenantId).crear({
          nombre,
          tipo,
          icono,
          usuarioId: actor.id,
        });
      } catch (error) {
        if (esDuplicado(error)) throw duplicada();
        throw error;
      }
    },

    /** Solo nombre e ícono; el tipo no cambia. */
    async actualizar(actor, id, cambios) {
      if (cambios.nombre === undefined && cambios.icono === undefined) {
        throw new ValidationError([{ campo: 'nombre', mensaje: MENSAJES.generales.requerido('El nombre') }]);
      }
      let categoria;
      try {
        categoria = await categoriaRepository(actor.tenantId).actualizarPorId(id, cambios);
      } catch (error) {
        if (esDuplicado(error)) throw duplicada();
        throw error;
      }
      if (!categoria) throw new NotFoundError();
      return categoria;
    },

    /** No elimina una categoría con movimientos: la cuenta y el borrado van en la misma transacción. */
    async eliminar(actor, id) {
      const repositorio = categoriaRepository(actor.tenantId);
      const sesion = await mongoose.startSession();
      try {
        await sesion.withTransaction(async () => {
          const categoria = await repositorio.encontrarPorId(id, { session: sesion });
          if (!categoria) throw new NotFoundError();
          if ((await repositorio.contarMovimientos(categoria._id, { session: sesion })) > 0) {
            throw new ConflictError(MENSAJES.categoria.conMovimientos);
          }
          await repositorio.eliminarPorId(categoria._id, { session: sesion });
        });
      } finally {
        await sesion.endSession();
      }
      logger.info({ usuarioId: actor.id, categoriaId: id }, 'categoría eliminada');
    },

    /** Lectura de administrador (HU-04, HU-22): solo lectura, con el rol comprobado en el servicio. */
    async listarDeUsuario(actor, usuarioId, { tipo, page, limit, sort }) {
      const lectura = await admin.repositorioLecturaDe(actor, ModeloCategoria, usuarioId);
      return lectura.listar(tipo ? { tipo } : {}, {
        page,
        limit,
        sort: ordenCategorias(sort),
        collation: INTERCALACION,
      });
    },
  };
}
