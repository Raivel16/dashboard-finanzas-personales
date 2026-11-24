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
import { crearCategoriaService } from './services/categoria.service.js';
import { crearCategoriaController } from './controllers/categoria.controller.js';
import { crearCategoriasRoutes } from './routes/categorias.routes.js';
import { crearCuentaService } from './services/cuenta.service.js';
import { crearCuentaController } from './controllers/cuenta.controller.js';
import { crearCuentasRoutes } from './routes/cuentas.routes.js';
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
 * @param {Function} [opciones.crearCategoriasIniciales]  reemplaza la creación de categorías del registro (pruebas)
 * @param {(api: import('express').Router) => void} [opciones.extras]  rutas adicionales (pruebas)
 */
export function crearApp({
  config,
  logger = crearLogger(config),
  reloj = relojSistema,
  correo = crearServicioCorreo({ config, logger }),
  costoBcrypt = 12,
  crearCategoriasIniciales,
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
  const auth = crearAuthService({
    config,
    reloj,
    correo,
    logger,
    sesiones,
    costoBcrypt,
    crearCategoriasIniciales,
  });
  const recuperacion = crearRecuperacionService({ config, reloj, correo, logger, sesiones, costoBcrypt });
  const perfil = crearPerfilService({ reloj, correo, logger, sesiones, costoBcrypt });
  const autorizacion = crearAutorizacion({ logger });
  const admin = crearAdminService({ autorizacion, logger });
  const categorias = crearCategoriaService({ admin, logger });
  const categoriaController = crearCategoriaController({ categorias });
  const cuentas = crearCuentaService({ admin, logger });
  const cuentaController = crearCuentaController({ cuentas });
  const autenticar = crearAutenticar(sesiones);
  const requerirRol = crearRequerirRol(autorizacion);
  app.locals.servicios = { sesiones, auth, recuperacion, perfil, autorizacion, admin, categorias, cuentas };

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
  api.use('/categorias', crearCategoriasRoutes({ controlador: categoriaController, autenticar }));
  api.use('/cuentas', crearCuentasRoutes({ controlador: cuentaController, autenticar }));
  api.use(
    '/admin',
    crearAdminRoutes({
      controlador: crearAdminController({ admin }),
      categorias: categoriaController,
      cuentas: cuentaController,
      autenticar,
      requerirRol,
    }),
  );
  extras?.(api, { autenticar, requerirRol, admin });
  app.use('/api/v1', api);

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores(logger));
  return app;
}
