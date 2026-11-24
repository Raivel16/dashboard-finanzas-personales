import { Router } from 'express';
import { esquemaConsultaMovimientos } from '@finanzas/shared';
import { validarConsulta } from '../middlewares/validacion.middleware.js';

// El cuerpo se valida en el servicio: la regla de la fecha ("no futura") depende de la fecha de hoy.
export function crearMovimientosRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.get('/', validarConsulta(esquemaConsultaMovimientos), controlador.listar);
  router.post('/', controlador.crear);
  router.get('/:id', controlador.obtener);
  router.patch('/:id', controlador.actualizar);
  router.delete('/:id', controlador.eliminar);
  return router;
}
