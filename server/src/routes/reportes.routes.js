import { Router } from 'express';
import { esquemaConsultaReporte } from '@finanzas/shared';
import { validarConsulta } from '../middlewares/validacion.middleware.js';

export function crearReportesRoutes({ controlador, autenticar }) {
  const router = Router();
  router.use(autenticar);
  router.get('/movimientos.pdf', validarConsulta(esquemaConsultaReporte), controlador.pdf);
  router.get('/movimientos.xlsx', validarConsulta(esquemaConsultaReporte), controlador.excel);
  return router;
}
