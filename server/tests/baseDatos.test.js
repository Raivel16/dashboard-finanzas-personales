import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { conectar, desconectar } from '../src/config/baseDatos.js';
import { ConfigurationError } from '../src/utils/errores.js';
import { iniciarReplicaSet } from './helpers/baseDatos.js';

describe('conexión a MongoDB (RT-01)', () => {
  afterEach(async () => {
    await desconectar();
  });

  it('Base de datos sin replica set: no arranca y explica cómo habilitarlo', async () => {
    const servidor = await MongoMemoryServer.create();
    try {
      const intento = conectar(servidor.getUri());
      await expect(intento).rejects.toBeInstanceOf(ConfigurationError);
      await expect(intento).rejects.toThrow(/replica set[\s\S]*replSetName: rs0[\s\S]*rs\.initiate\(\)/);
      expect(mongoose.connection.readyState).toBe(0); // se cerró la conexión
    } finally {
      await servidor.stop();
    }
  });

  it('conecta cuando MongoDB es un replica set con nodo primario', async () => {
    const replica = await iniciarReplicaSet();
    try {
      const conexion = await conectar(replica.getUri());
      expect(conexion.readyState).toBe(1);
    } finally {
      await desconectar();
      await replica.stop();
    }
  });
});
