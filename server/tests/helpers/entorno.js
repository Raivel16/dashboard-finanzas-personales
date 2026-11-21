import { leerEntorno } from '../../src/config/entorno.js';

/** Configuración válida para pruebas (sin .env, sin SMTP, sin servicios externos). */
export function configPrueba(extra = {}) {
  return leerEntorno({
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/prueba',
    CLIENT_URL: 'http://localhost:5173',
    JWT_ACCESS_SECRET: 'secreto-de-prueba-con-32-caracteres!!',
    ...extra,
  });
}
