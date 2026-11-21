import { leerEntorno } from '../src/config/entorno.js';
import { ConfigurationError } from '../src/utils/errores.js';

const base = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/finanzas',
  CLIENT_URL: 'http://localhost:5173',
  JWT_ACCESS_SECRET: 'un-secreto-muy-largo-de-mas-de-32-caracteres',
};

describe('configuración del entorno (RT-01)', () => {
  it('aplica los valores por defecto del diseño', () => {
    const config = leerEntorno(base);
    expect(config).toMatchObject({
      entorno: 'development',
      puerto: 3000,
      zonaHoraria: 'America/Lima',
      sesion: { inactividadMin: 30, absolutaDias: 7 },
      resetTokenTtlMin: 30,
      jwt: { ttl: '15m' },
      smtp: null,
    });
  });

  it('Configuración incompleta: indica qué variable falta sin mostrar secretos', () => {
    const incompleto = { ...base, MONGODB_URI: undefined };
    let error;
    try {
      leerEntorno(incompleto);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toContain('MONGODB_URI');
    expect(error.message).not.toContain(base.JWT_ACCESS_SECRET);
    expect(error.problemas).toEqual(['Falta la variable de entorno MONGODB_URI']);
  });

  it('informa todas las variables faltantes a la vez', () => {
    expect(() => leerEntorno({})).toThrow(/MONGODB_URI[\s\S]*CLIENT_URL[\s\S]*JWT_ACCESS_SECRET/);
  });

  it('rechaza un secreto corto sin repetirlo en el mensaje', () => {
    const secreto = 'corto';
    let error;
    try {
      leerEntorno({ ...base, JWT_ACCESS_SECRET: secreto });
    } catch (e) {
      error = e;
    }
    expect(error.message).toContain('al menos 32 caracteres');
    expect(error.message).not.toContain(`"${secreto}"`);
  });

  it('valida el formato de puerto, URI y zona horaria', () => {
    expect(() => leerEntorno({ ...base, PORT: '99999' })).toThrow(/PORT/);
    expect(() => leerEntorno({ ...base, MONGODB_URI: 'http://localhost' })).toThrow(/MONGODB_URI/);
    expect(() => leerEntorno({ ...base, APP_TIMEZONE: 'Marte/Olimpo' })).toThrow(/APP_TIMEZONE/);
  });

  it('exige SMTP_HOST en producción para no registrar correos en el log', () => {
    expect(() => leerEntorno({ ...base, NODE_ENV: 'production' })).toThrow(
      /SMTP_HOST \(obligatoria en producción\)/,
    );
    expect(leerEntorno({ ...base, NODE_ENV: 'development' }).smtp).toBeNull();
  });

  it('exige usuario, clave y remitente cuando se define SMTP_HOST', () => {
    expect(() => leerEntorno({ ...base, SMTP_HOST: 'smtp.ejemplo.com' })).toThrow(
      /SMTP_USER[\s\S]*SMTP_PASS[\s\S]*MAIL_FROM/,
    );
    const config = leerEntorno({
      ...base,
      SMTP_HOST: 'smtp.ejemplo.com',
      SMTP_USER: 'u',
      SMTP_PASS: 'p',
      MAIL_FROM: 'App <app@ejemplo.com>',
    });
    expect(config.smtp).toEqual({ host: 'smtp.ejemplo.com', puerto: 587, usuario: 'u', clave: 'p' });
    expect(config.correoRemitente).toBe('App <app@ejemplo.com>');
  });
});
