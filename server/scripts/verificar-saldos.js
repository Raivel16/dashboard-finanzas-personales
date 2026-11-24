/**
 * Verificación de saldos (HU-26): comprueba que el saldo de cada cuenta sea igual a
 * saldo inicial + ingresos − gastos.
 *
 *   npm run verificar-saldos -w server
 *
 * Solo lee: lista las cuentas que no cuadran y termina con código 1 si hay alguna. No corrige nada.
 * Es una herramienta de mantenimiento que recorre todos los inquilinos, por eso lee las colecciones directamente.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Decimal from 'decimal.js';
import mongoose from 'mongoose';

const URI_LOCAL = 'mongodb://127.0.0.1:27017/finanzas?directConnection=true';
const comoDecimal = (valor) => new Decimal(String(valor));

/** Devuelve las cuentas cuyo saldo guardado difiere del esperado, junto con el total revisado. */
export async function verificarSaldos(conexion = mongoose.connection) {
  const netos = await conexion
    .collection('movimientos')
    .aggregate([
      {
        $group: {
          _id: '$cuentaId',
          neto: { $sum: { $cond: [{ $eq: ['$tipo', 'ingreso'] }, '$monto', { $multiply: ['$monto', -1] }] } },
        },
      },
    ])
    .toArray();
  const netoDe = new Map(netos.map((fila) => [String(fila._id), comoDecimal(fila.neto)]));

  const diferencias = [];
  let revisadas = 0;
  for await (const cuenta of conexion.collection('cuentas').find()) {
    revisadas += 1;
    const esperado = comoDecimal(cuenta.saldoInicial).plus(netoDe.get(String(cuenta._id)) ?? 0);
    const guardado = comoDecimal(cuenta.saldoActual);
    if (!esperado.equals(guardado)) {
      diferencias.push({
        id: String(cuenta._id),
        nombre: cuenta.nombre,
        guardado: guardado.toFixed(2),
        esperado: esperado.toFixed(2),
      });
    }
  }
  return { revisadas, diferencias };
}

async function main() {
  const dirServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    process.loadEnvFile(path.join(dirServidor, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mongoose.connect(process.env.MONGODB_URI || URI_LOCAL, { serverSelectionTimeoutMS: 5000 });
  try {
    const { revisadas, diferencias } = await verificarSaldos();
    if (diferencias.length === 0) {
      console.log(`Saldos correctos: ${revisadas} cuentas revisadas.`);
      return;
    }
    console.error(`${diferencias.length} de ${revisadas} cuentas no cuadran:`);
    for (const d of diferencias) {
      console.error(`- ${d.nombre} (${d.id}): guardado ${d.guardado}, esperado ${d.esperado}`);
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`No se pudo verificar los saldos: ${error.message}`);
    process.exitCode = 1;
  });
}
