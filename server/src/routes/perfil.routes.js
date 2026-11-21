import { Router } from 'express';
import { esquemaActualizarPerfil, esquemaCambiarContrasena } from '@finanzas/shared';
import { validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearPerfilRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.patch('/', validarCuerpo(esquemaActualizarPerfil), controlador.actualizar);
  router.put('/contrasena', validarCuerpo(esquemaCambiarContrasena), controlador.cambiarContrasena);
  return router;
}
