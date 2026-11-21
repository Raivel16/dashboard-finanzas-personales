// Arma la aplicación Express: seguridad, parseo, rutas bajo /api/v1 y manejo central de errores.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import healthRoutes from './routes/health.routes.js';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/errores.middleware.js';
import { crearLogger } from './utils/logger.js';

/**
 * @param {object} opciones
 * @param {object} opciones.config  configuración validada (ver config/entorno.js)
 * @param {object} [opciones.logger]
 * @param {(api: import('express').Router) => void} [opciones.extras]  rutas adicionales (pruebas)
 */
export function crearApp({ config, logger = crearLogger(config), extras } = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.use(helmet());
  // Solo se responde con cabeceras CORS al origen del cliente; cualquier otro origen no las recibe.
  app.use(
    cors({
      origin: (origen, devolver) => devolver(null, origen === config.clientUrl ? origen : false),
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.use('/health', healthRoutes);
  extras?.(api);
  app.use('/api/v1', api);

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores(logger));
  return app;
}
