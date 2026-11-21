// Punto de entrada: valida la configuración, conecta a MongoDB (replica set) y levanta la API.
import { fileURLToPath } from 'node:url';
import { cargarArchivoEnv, leerEntorno } from './config/entorno.js';
import { conectar, desconectar } from './config/baseDatos.js';
import { crearApp } from './app.js';
import { crearLogger } from './utils/logger.js';
import { ConfigurationError } from './utils/errores.js';

async function iniciar() {
  cargarArchivoEnv(fileURLToPath(new URL('../.env', import.meta.url)));
  const config = leerEntorno();
  const logger = crearLogger(config);

  await conectar(config.mongodbUri);
  logger.info('conectado a MongoDB (replica set)');

  const servidor = crearApp({ config, logger }).listen(config.puerto, () => {
    logger.info(`API escuchando en http://localhost:${config.puerto}/api/v1`);
  });

  const cerrar = async (senal) => {
    logger.info(`${senal} recibida, cerrando…`);
    servidor.close(async () => {
      await desconectar();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => cerrar('SIGINT'));
  process.on('SIGTERM', () => cerrar('SIGTERM'));
}

iniciar().catch((error) => {
  if (error instanceof ConfigurationError) {
    console.error(`\n${error.message}\n`);
  } else {
    console.error('No se pudo iniciar el servidor:', error.message);
  }
  process.exit(1);
});
