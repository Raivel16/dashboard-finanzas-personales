import { Router } from 'express';
import {
  esquemaInicioSesion,
  esquemaOlvideContrasena,
  esquemaRegistro,
  esquemaRestablecerContrasena,
} from '@finanzas/shared';
import { sinCache } from '../middlewares/autenticacion.middleware.js';
import { validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearAuthRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(sinCache);

  router.post('/registro', validarCuerpo(esquemaRegistro), controlador.registro);
  router.post('/login', validarCuerpo(esquemaInicioSesion), controlador.login);
  router.post('/refresh', controlador.refresh);
  router.post('/logout', controlador.logout);
  router.get('/me', autenticar, controlador.me);
  router.post('/olvide-contrasena', validarCuerpo(esquemaOlvideContrasena), controlador.olvideContrasena);
  router.post(
    '/restablecer-contrasena',
    validarCuerpo(esquemaRestablecerContrasena),
    controlador.restablecerContrasena,
  );
  return router;
}
