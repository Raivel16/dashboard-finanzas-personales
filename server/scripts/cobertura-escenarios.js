/**
 * Matriz de cobertura de escenarios (RT-09).
 *
 *   npm run cobertura              Regenera docs/cobertura-escenarios.md
 *   npm run cobertura:comprobar    No escribe: falla si un escenario no tiene prueba, si una prueba citada no existe
 *                                  o si la matriz publicada está desactualizada (lo ejecuta la integración continua)
 *
 * El mapa escenario → pruebas está en docs/cobertura-escenarios.json:
 *   { "HU-01": { "1": [["server/tests/registro.test.js", "título de la prueba"]] } }
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HISTORIAS = 'docs/historias-de-usuario.md';
const MAPA = 'docs/cobertura-escenarios.json';
const MATRIZ = 'docs/cobertura-escenarios.md';
const COMANDO = 'npm run cobertura';

const sinRetornos = (texto) => texto.replace(/\r\n/g, '\n');

/** Escenarios del documento de historias, en su orden: { hu, titulo, numero, nombre }. */
export function leerEscenarios(documento) {
  const escenarios = [];
  let historia = null;
  for (const linea of sinRetornos(documento).split('\n')) {
    const encabezado = /^### (HU-\d+) — (.*)$/.exec(linea);
    if (encabezado) historia = { hu: encabezado[1], titulo: encabezado[2].trim() };
    const escenario = /^\*\*Escenario (\d+): (.*)\*\*$/.exec(linea);
    if (escenario && historia) {
      escenarios.push({ ...historia, numero: Number(escenario[1]), nombre: escenario[2].trim() });
    }
  }
  return escenarios;
}

/** Línea (1-based) donde se declara la prueba: primero una línea con it( o test(, luego cualquier línea con el título. */
function lineaDePrueba(lineas, titulo) {
  const declarada = lineas.findIndex((l) => /\b(it|test)\(/.test(l) && l.includes(titulo));
  const indice = declarada >= 0 ? declarada : lineas.findIndex((l) => l.includes(titulo));
  return indice >= 0 ? indice + 1 : null;
}

/**
 * Cruza los escenarios con el mapa. `leerArchivo(ruta)` devuelve el texto de un archivo de prueba o null si no existe.
 * Devuelve las filas de la matriz y la lista de problemas encontrados.
 */
export function verificarCobertura({ escenarios, mapa, leerArchivo }) {
  const problemas = [];
  const filas = [];
  const cache = new Map();
  const lineasDe = (archivo) => {
    if (!cache.has(archivo)) {
      const texto = leerArchivo(archivo);
      cache.set(archivo, texto === null ? null : sinRetornos(texto).split('\n'));
    }
    return cache.get(archivo);
  };

  for (const escenario of escenarios) {
    const { hu, numero } = escenario;
    const pruebas = mapa[hu]?.[String(numero)] ?? [];
    if (pruebas.length === 0) {
      problemas.push(`${hu} escenario ${numero} ("${escenario.nombre}"): no tiene ninguna prueba en ${MAPA}`);
      continue;
    }
    const enlaces = [];
    for (const [archivo, titulo] of pruebas) {
      const lineas = lineasDe(archivo);
      const linea = lineas && lineaDePrueba(lineas, titulo);
      if (!linea) {
        problemas.push(
          lineas
            ? `${hu} escenario ${numero}: no encuentro la prueba "${titulo}" en ${archivo}`
            : `${hu} escenario ${numero}: no existe el archivo ${archivo}`,
        );
        continue;
      }
      enlaces.push({ archivo, linea });
    }
    filas.push({ ...escenario, enlaces });
  }

  const existentes = new Set(escenarios.map((e) => `${e.hu}#${e.numero}`));
  for (const [hu, porNumero] of Object.entries(mapa)) {
    for (const numero of Object.keys(porNumero)) {
      if (!existentes.has(`${hu}#${numero}`)) {
        problemas.push(`${hu} escenario ${numero}: está en ${MAPA} pero no en ${HISTORIAS}`);
      }
    }
  }
  return { filas, problemas };
}

/** Texto Markdown de la matriz. Los enlaces son relativos a docs/. */
export function generarMatriz(filas) {
  const historias = new Set(filas.map((f) => f.hu)).size;
  const salida = [
    '# Cobertura de escenarios',
    '',
    `Cada uno de los ${filas.length} escenarios de [historias-de-usuario.md](historias-de-usuario.md) (${historias} historias) y la prueba automática que lo verifica. "server/tests" son pruebas de la API (Jest + Supertest) y "client/tests" pruebas de la interfaz (Vitest + Testing Library).`,
    '',
    `Este archivo se genera con \`${COMANDO}\` a partir de [cobertura-escenarios.json](cobertura-escenarios.json); la integración continua falla si un escenario queda sin prueba o si este archivo no está al día (RT-09).`,
    '',
  ];
  let actual = null;
  for (const fila of filas) {
    if (fila.hu !== actual) {
      salida.push('', `## ${fila.hu} — ${fila.titulo}`, '', '| # | Escenario | Pruebas |', '|---|---|---|');
      actual = fila.hu;
    }
    const celdas = fila.enlaces.map(
      ({ archivo, linea }) => `[${path.posix.basename(archivo)}:${linea}](../${archivo}#L${linea})`,
    );
    salida.push(`| ${fila.numero} | ${fila.nombre} | ${celdas.join('<br>')} |`);
  }
  return `${salida.join('\n')}\n`;
}

/** Ejecuta la verificación sobre un repositorio. Devuelve { codigo, mensajes }. */
export function ejecutar({ raiz, comprobar }) {
  const leer = (relativo) => {
    try {
      return readFileSync(path.join(raiz, relativo), 'utf8');
    } catch {
      return null;
    }
  };
  const escenarios = leerEscenarios(leer(HISTORIAS) ?? '');
  const mapa = JSON.parse(leer(MAPA) ?? '{}');
  const { filas, problemas } = verificarCobertura({ escenarios, mapa, leerArchivo: leer });
  if (escenarios.length === 0) problemas.push(`No encontré escenarios en ${HISTORIAS}`);
  if (problemas.length > 0) {
    return {
      codigo: 1,
      mensajes: ['Cobertura de escenarios incompleta:', ...problemas.map((p) => `  - ${p}`)],
    };
  }

  const matriz = generarMatriz(filas);
  if (comprobar) {
    if (sinRetornos(leer(MATRIZ) ?? '') !== matriz) {
      return { codigo: 1, mensajes: [`${MATRIZ} está desactualizado. Regenéralo con: ${COMANDO}`] };
    }
    return { codigo: 0, mensajes: [`Los ${filas.length} escenarios tienen prueba y ${MATRIZ} está al día.`] };
  }
  writeFileSync(path.join(raiz, MATRIZ), matriz);
  return { codigo: 0, mensajes: [`${MATRIZ} generado: ${filas.length} escenarios con prueba.`] };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const { codigo, mensajes } = ejecutar({ raiz, comprobar: process.argv.includes('--comprobar') });
  (codigo === 0 ? console.log : console.error)(mensajes.join('\n'));
  process.exitCode = codigo;
}
