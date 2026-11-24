import { Router } from 'express';
import { esquemaActualizarCuenta, esquemaConsultaCuentas, esquemaCuenta } from '@finanzas/shared';
import { validarConsulta, validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearCuentasRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.get('/', validarConsulta(esquemaConsultaCuentas), controlador.listar);
  router.post('/', validarCuerpo(esquemaCuenta), controlador.crear);
  router.get('/:id', controlador.obtener);
  router.patch('/:id', validarCuerpo(esquemaActualizarCuenta), controlador.actualizar);
  router.delete('/:id', controlador.eliminar);
  return router;
}
