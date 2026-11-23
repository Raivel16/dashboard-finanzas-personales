// Entorno de pruebas de la API de autenticación: MongoDB en memoria (replica set), reloj movible y correo simulado.
import { jest } from '@jest/globals';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { conectar, desconectar } from '../../src/config/baseDatos.js';
import { crearServicioCorreo } from '../../src/services/correo.service.js';
import { crearRelojManual } from '../../src/utils/reloj.js';
import { crearLogger } from '../../src/utils/logger.js';
import { configPrueba } from './entorno.js';
import { iniciarReplicaSet } from './baseDatos.js';

export const CLAVE = 'Clave1234';

/** Levanta la API con reloj manual y un transporte de correo que guarda lo que "envía". */
export async function iniciarEntorno({ extras, crearCategoriasIniciales } = {}) {
  const replica = await iniciarReplicaSet();
  await conectar(replica.getUri());
  const config = configPrueba();
  const reloj = crearRelojManual();
  const transporte = { sendMail: jest.fn().mockResolvedValue({ messageId: 'prueba' }) };
  const logger = crearLogger(config);
  const correo = crearServicioCorreo({
    config: { ...config, correoRemitente: 'app@prueba.test' },
    logger,
    transporte,
  });
  const app = crearApp({ config, logger, reloj, correo, costoBcrypt: 4, crearCategoriasIniciales, extras });

  let contador = 0;
  const correoUnico = () => `persona${(contador += 1)}.${Date.now()}@correo.com`;

  /** Registra un usuario por la API y devuelve sus datos y la contraseña. */
  const registrar = async (extra = {}) => {
    const datos = { nombre: 'Ana Torres', email: correoUnico(), password: CLAVE, ...extra };
    const res = await request(app).post('/api/v1/auth/registro').send(datos);
    return { ...datos, id: res.body.data?.id, res };
  };

  /** Inicia sesión con un agente nuevo (un "dispositivo" con sus propias cookies). */
  const iniciarSesion = async (usuario, password = usuario.password) => {
    const agente = request.agent(app);
    const res = await agente.post('/api/v1/auth/login').send({ email: usuario.email, password });
    return { agente, res };
  };

  const cerrar = async () => {
    await desconectar();
    await replica.stop();
  };

  return { app, config, reloj, transporte, registrar, iniciarSesion, correoUnico, cerrar };
}

/** Extrae el valor de una cookie de la cabecera set-cookie de una respuesta. */
export const cookieDe = (res, nombre) => {
  const linea = (res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${nombre}=`));
  return linea ? { valor: linea.split(';')[0].split('=')[1], texto: linea } : null;
};

/** Último correo enviado por el transporte simulado. */
export const ultimoCorreo = (transporte) => transporte.sendMail.mock.calls.at(-1)?.[0];
