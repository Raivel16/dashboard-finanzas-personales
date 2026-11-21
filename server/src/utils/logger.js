import pino from 'pino';

/** Logger estructurado. Silencioso en pruebas y con formato legible en desarrollo. */
export function crearLogger(config = {}) {
  const entorno = config.entorno ?? 'development';
  if (entorno === 'test') return pino({ level: 'silent' });
  const base = {
    level: entorno === 'production' ? 'info' : 'debug',
    redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
  };
  if (entorno === 'development') {
    return pino({
      ...base,
      transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
    });
  }
  return pino(base);
}
