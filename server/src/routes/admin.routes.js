import { Router } from 'express';
import {
  ROLES,
  esquemaCambiarRol,
  esquemaConsultaCategorias,
  esquemaConsultaCuentas,
  esquemaConsultaMovimientos,
  esquemaConsultaUsuarios,
} from '@finanzas/shared';
import { validarConsulta, validarCuerpo } from '../middlewares/validacion.middleware.js';

export function crearAdminRoutes({ controlador, categorias, cuentas, movimientos, autenticar, requerirRol }) {
  const router = Router();
  router.use(autenticar, requerirRol(ROLES.ADMIN));
  router.get('/usuarios', validarConsulta(esquemaConsultaUsuarios), controlador.listarUsuarios);
  router.get('/usuarios/:id', controlador.obtenerUsuario);
  router.patch('/usuarios/:id/rol', validarCuerpo(esquemaCambiarRol), controlador.cambiarRol);
  // Solo lectura: no existen rutas de escritura de administrador sobre los datos de otras personas.
  router.get(
    '/usuarios/:id/categorias',
    validarConsulta(esquemaConsultaCategorias),
    categorias.listarDeUsuario,
  );
  router.get('/usuarios/:id/cuentas', validarConsulta(esquemaConsultaCuentas), cuentas.listarDeUsuario);
  router.get(
    '/usuarios/:id/movimientos',
    validarConsulta(esquemaConsultaMovimientos),
    movimientos.listarDeUsuario,
  );
  return router;
}
