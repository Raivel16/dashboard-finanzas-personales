import { Router } from 'express';
import { ROLES, esquemaCambiarRol, esquemaConsultaUsuarios } from '@finanzas/shared';
import { validarConsulta, validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearAdminRoutes({ controlador, autenticar, requerirRol }) {
  const router = Router();
  router.use(autenticar, requerirRol(ROLES.ADMIN));
  router.get('/usuarios', validarConsulta(esquemaConsultaUsuarios), controlador.listarUsuarios);
  router.get('/usuarios/:id', controlador.obtenerUsuario);
  router.patch('/usuarios/:id/rol', validarCuerpo(esquemaCambiarRol), controlador.cambiarRol);
  return router;
}
