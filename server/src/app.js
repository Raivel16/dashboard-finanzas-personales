// Arma la aplicación Express: seguridad, parseo, rutas bajo /api/v1 y manejo central de errores.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import healthRoutes from './routes/health.routes.js';
import { crearAutorizacion } from './services/autorizacion.service.js';
import { crearAdminService } from './services/admin.service.js';
import { crearAdminController } from './controllers/admin.controller.js';
import { crearAdminRoutes } from './routes/admin.routes.js';
import { crearRequerirRol } from './middlewares/autorizacion.middleware.js';
import { crearPerfilService } from './services/perfil.service.js';
import { crearPerfilController } from './controllers/perfil.controller.js';
import { crearPerfilRoutes } from './routes/perfil.routes.js';
import { crearAuthRoutes } from './routes/auth.routes.js';
import { crearAuthController } from './controllers/auth.controller.js';
import { crearAuthService } from './services/auth.service.js';
import { crearRecuperacionService } from './services/recuperacion.service.js';
import { crearSesionService } from './services/sesion.service.js';
import { crearServicioCorreo } from './services/correo.service.js';
import { crearAutenticar, sinCache } from './middlewares/autenticacion.middleware.js';
import { relojSistema } from './utils/reloj.js';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/errores.middleware.js';
import { crearLogger } from './utils/logger.js';

/**
 * @param {object} opciones
 * @param {object} opciones.config  configuración validada (ver config/entorno.js)
 * @param {object} [opciones.logger]
 * @param {{ ahora: () => Date }} [opciones.reloj]  reloj inyectable (pruebas de expiración)
 * @param {{ enviar: Function }} [opciones.correo]  servicio de correo (pruebas inyectan uno simulado)
 * @param {number} [opciones.costoBcrypt]  12 en producción; las pruebas usan un costo menor
 * @param {(api: import('express').Router) => void} [opciones.extras]  rutas adicionales (pruebas)
 */
export function crearApp({
  config,
  logger = crearLogger(config),
  reloj = relojSistema,
  correo = crearServicioCorreo({ config, logger }),
  costoBcrypt = 12,
  extras,
} = {}) {
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

  // Servicios y controladores se arman aquí una sola vez y se comparten con las rutas.
  const sesiones = crearSesionService({ config, reloj });
  const auth = crearAuthService({ config, reloj, correo, logger, sesiones, costoBcrypt });
  const recuperacion = crearRecuperacionService({ config, reloj, correo, logger, sesiones, costoBcrypt });
  const perfil = crearPerfilService({ reloj, correo, logger, sesiones, costoBcrypt });
  const autorizacion = crearAutorizacion({ logger });
  const admin = crearAdminService({ autorizacion, logger });
  const autenticar = crearAutenticar(sesiones);
  const requerirRol = crearRequerirRol(autorizacion);
  app.locals.servicios = { sesiones, auth, recuperacion, perfil, autorizacion, admin };

  const api = express.Router();
  api.use(sinCache);
  api.use('/health', healthRoutes);
  api.use(
    '/auth',
    crearAuthRoutes({
      controlador: crearAuthController({ config, reloj, auth, sesiones, recuperacion }),
      autenticar,
    }),
  );
  api.use('/perfil', crearPerfilRoutes({ controlador: crearPerfilController({ perfil }), autenticar }));
  api.use(
    '/admin',
    crearAdminRoutes({ controlador: crearAdminController({ admin }), autenticar, requerirRol }),
  );
  extras?.(api, { autenticar, requerirRol, admin });
  app.use('/api/v1', api);

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores(logger));
  return app;
}
