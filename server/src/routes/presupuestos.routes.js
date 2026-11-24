import { Router } from 'express';
import {
  esquemaConsultaPresupuestos,
  esquemaPresupuesto,
  esquemaReemplazarPresupuesto,
  esquemaSeguimientoPresupuestos,
} from '@finanzas/shared';
import { validarConsulta, validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearPresupuestosRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.get('/', validarConsulta(esquemaConsultaPresupuestos), controlador.listar);
  router.get('/seguimiento', validarConsulta(esquemaSeguimientoPresupuestos), controlador.seguimiento);
  router.post('/', validarCuerpo(esquemaPresupuesto), controlador.crear);
  router.put('/:id', validarCuerpo(esquemaReemplazarPresupuesto), controlador.reemplazar);
  router.delete('/:id', controlador.eliminar);
  return router;
}
