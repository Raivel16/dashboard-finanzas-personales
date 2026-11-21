import request from 'supertest';
import { crearApp } from '../src/app.js';
import { conectar, desconectar } from '../src/config/baseDatos.js';
import { configPrueba } from './helpers/entorno.js';
import { iniciarReplicaSet } from './helpers/baseDatos.js';

const app = crearApp({ config: configPrueba() });

describe('GET /api/v1/health', () => {
  it('informa que la base de datos no está disponible si no hay conexión', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { api: 'ok', baseDatos: 'error', replicaSet: null } });
  });

  describe('con MongoDB conectado', () => {
    let replica;
    beforeAll(async () => {
      replica = await iniciarReplicaSet();
      await conectar(replica.getUri());
    });
    afterAll(async () => {
      await desconectar();
      await replica.stop();
    });

    it('informa API y base de datos disponibles, y el nombre del replica set', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ api: 'ok', baseDatos: 'ok' });
      expect(typeof res.body.data.replicaSet).toBe('string');
    });
  });
});
