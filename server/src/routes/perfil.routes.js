import { Router } from 'express';
import { esquemaActualizarPerfil, esquemaCambiarContrasena, esquemaPreferencias } from '@finanzas/shared';
import { validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearPerfilRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.patch('/', validarCuerpo(esquemaActualizarPerfil), controlador.actualizar);
  router.patch('/preferencias', validarCuerpo(esquemaPreferencias), controlador.actualizarPreferencias);
  router.put('/contrasena', validarCuerpo(esquemaCambiarContrasena), controlador.cambiarContrasena);
  return router;
}
