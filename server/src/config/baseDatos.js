// Conexión a MongoDB. Las transacciones (saldo consistente) exigen replica set, igual que Atlas.
import mongoose from 'mongoose';
import { ConfigurationError } from '../utils/errores.js';

export const AYUDA_REPLICA_SET =
  'MongoDB debe ejecutarse como replica set para admitir transacciones. En local: agrega ' +
  '"replication:\\n  replSetName: rs0" a mongod.cfg, reinicia el servicio y ejecuta rs.initiate() ' +
  '(ver README, sección "MongoDB como replica set"). Con MongoDB Atlas ya viene habilitado.';

/** Comprueba que la conexión activa pertenezca a un replica set con un nodo primario. */
export async function comprobarReplicaSet(conexion = mongoose.connection) {
  const hello = await conexion.db.admin().command({ hello: 1 });
  if (!hello.setName) {
    throw new ConfigurationError(`La base de datos no es un replica set. ${AYUDA_REPLICA_SET}`);
  }
  if (!hello.isWritablePrimary) {
    throw new ConfigurationError(
      `El replica set "${hello.setName}" no tiene un nodo primario disponible. Verifica con rs.status().`,
    );
  }
  return hello.setName;
}

export async function conectar(uri, { comprobar = true } = {}) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    if (comprobar) await comprobarReplicaSet();
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
  return mongoose.connection;
}

export async function desconectar() {
  await mongoose.disconnect();
}

/** Estado resumido para el endpoint de salud. */
export async function estadoBaseDatos(conexion = mongoose.connection) {
  if (conexion.readyState !== 1) return { conectada: false, replicaSet: null };
  try {
    const hello = await conexion.db.admin().command({ hello: 1 });
    return { conectada: true, replicaSet: hello.setName ?? null };
  } catch {
    return { conectada: false, replicaSet: null };
  }
}
