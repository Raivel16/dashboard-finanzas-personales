// Ejecuta trabajo(sesion) en una transacción de MongoDB (requiere replica set). Si el trabajo falla se anula todo;
// los conflictos de escritura entre operaciones simultáneas se reintentan, así que `trabajo` debe poder repetirse.
import mongoose from 'mongoose';

export async function enTransaccion(trabajo) {
  const sesion = await mongoose.startSession();
  try {
    let resultado;
    await sesion.withTransaction(async () => {
      resultado = await trabajo(sesion);
    });
    return resultado;
  } finally {
    await sesion.endSession();
  }
}
