import { MongoMemoryReplSet } from 'mongodb-memory-server';

/** Replica set en memoria de un nodo: igual que Atlas, admite transacciones. */
export async function iniciarReplicaSet() {
  return MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
}
