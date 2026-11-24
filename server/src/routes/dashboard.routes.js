import { Router } from 'express';
import { esquemaConsultaDashboard } from '@finanzas/shared';
import { validarConsulta } from '../middlewares/validacion.middleware.js';

export function crearDashboardRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.get('/monedas', controlador.monedas);
  router.get('/indicadores', validarConsulta(esquemaConsultaDashboard), controlador.indicadores);
  router.get('/graficos', validarConsulta(esquemaConsultaDashboard), controlador.graficos);
  return router;
}
