import { Router } from 'express';
import {
  esquemaActualizarCategoria,
  esquemaCategoria,
  esquemaConsultaCategorias,
} from '@finanzas/shared';
import { validarConsulta, validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearCategoriasRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.get('/', validarConsulta(esquemaConsultaCategorias), controlador.listar);
  router.post('/', validarCuerpo(esquemaCategoria), controlador.crear);
  router.patch('/:id', validarCuerpo(esquemaActualizarCategoria), controlador.actualizar);
  router.delete('/:id', controlador.eliminar);
  return router;
}
