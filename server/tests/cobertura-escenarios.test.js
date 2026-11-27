// RT-09 · Verificar en la integración continua que cada escenario tenga su prueba (plataforma-proyecto).
// Usa un repositorio de ejemplo en un directorio temporal, sin depender del documento real de historias.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ejecutar, leerEscenarios } from '../scripts/cobertura-escenarios.js';

const HISTORIAS = `# Historias

### HU-01 — Registro de nuevo usuario

**Escenario 1: Registro exitoso**
- **DADO** ...

**Escenario 2: Correo repetido**
- **DADO** ...
`;

const PRUEBAS = `describe('registro', () => {
  it('Registro exitoso: crea la cuenta', () => {});

  it('Correo repetido: responde 409', () => {});
});
`;

const MAPA = {
  'HU-01': {
    1: [['server/tests/registro.test.js', 'Registro exitoso']],
    2: [['server/tests/registro.test.js', 'Correo repetido']],
  },
};

describe('RT-09 · cobertura de escenarios', () => {
  let raiz;
  const escribir = (relativo, contenido) => {
    const destino = path.join(raiz, relativo);
    mkdirSync(path.dirname(destino), { recursive: true });
    writeFileSync(destino, typeof contenido === 'string' ? contenido : JSON.stringify(contenido));
  };
  const matriz = () => readFileSync(path.join(raiz, 'docs/cobertura-escenarios.md'), 'utf8');

  beforeEach(() => {
    raiz = mkdtempSync(path.join(tmpdir(), 'cobertura-'));
    escribir('docs/historias-de-usuario.md', HISTORIAS);
    escribir('docs/cobertura-escenarios.json', MAPA);
    escribir('server/tests/registro.test.js', PRUEBAS);
  });
  afterEach(() => rmSync(raiz, { recursive: true, force: true }));

  it('lee los escenarios de cada historia en orden', () => {
    expect(leerEscenarios(HISTORIAS)).toEqual([
      { hu: 'HU-01', titulo: 'Registro de nuevo usuario', numero: 1, nombre: 'Registro exitoso' },
      { hu: 'HU-01', titulo: 'Registro de nuevo usuario', numero: 2, nombre: 'Correo repetido' },
    ]);
  });

  it('Todos los escenarios cubiertos: genera la matriz con enlaces a la línea de cada prueba y la comprobación pasa', () => {
    const generado = ejecutar({ raiz, comprobar: false });
    expect(generado.codigo).toBe(0);
    expect(generado.mensajes[0]).toMatch(/2 escenarios con prueba/);
    expect(matriz()).toContain(
      '| 1 | Registro exitoso | [registro.test.js:2](../server/tests/registro.test.js#L2) |',
    );
    expect(matriz()).toContain(
      '| 2 | Correo repetido | [registro.test.js:4](../server/tests/registro.test.js#L4) |',
    );

    expect(ejecutar({ raiz, comprobar: true })).toEqual({
      codigo: 0,
      mensajes: ['Los 2 escenarios tienen prueba y docs/cobertura-escenarios.md está al día.'],
    });
  });

  it('Escenario sin prueba: falla e indica la historia y el escenario', () => {
    escribir(
      'docs/historias-de-usuario.md',
      `${HISTORIAS}\n### HU-02 — Inicio de sesión\n\n**Escenario 1: Inicio exitoso**\n`,
    );
    const resultado = ejecutar({ raiz, comprobar: true });
    expect(resultado.codigo).toBe(1);
    expect(resultado.mensajes.join('\n')).toContain(
      'HU-02 escenario 1 ("Inicio exitoso"): no tiene ninguna prueba en docs/cobertura-escenarios.json',
    );
  });

  it('Prueba renombrada o eliminada: falla e indica el escenario, el archivo y el título', () => {
    escribir('server/tests/registro.test.js', PRUEBAS.replace('Correo repetido', 'Correo duplicado'));
    const resultado = ejecutar({ raiz, comprobar: false });
    expect(resultado.codigo).toBe(1);
    expect(resultado.mensajes.join('\n')).toContain(
      'HU-01 escenario 2: no encuentro la prueba "Correo repetido" en server/tests/registro.test.js',
    );

    escribir('docs/cobertura-escenarios.json', {
      'HU-01': { ...MAPA['HU-01'], 2: [['server/tests/borrado.test.js', 'Correo repetido']] },
    });
    expect(ejecutar({ raiz, comprobar: false }).mensajes.join('\n')).toContain(
      'HU-01 escenario 2: no existe el archivo server/tests/borrado.test.js',
    );
  });

  it('Matriz desactualizada: si una prueba cambia de línea, la comprobación falla e indica el comando', () => {
    ejecutar({ raiz, comprobar: false });
    escribir('server/tests/registro.test.js', `// comentario nuevo\n${PRUEBAS}`);

    expect(ejecutar({ raiz, comprobar: true })).toEqual({
      codigo: 1,
      mensajes: ['docs/cobertura-escenarios.md está desactualizado. Regenéralo con: npm run cobertura'],
    });
    // Un escenario que ya no está en el documento también se informa.
    escribir('docs/cobertura-escenarios.json', { 'HU-01': { ...MAPA['HU-01'], 3: MAPA['HU-01'][1] } });
    expect(ejecutar({ raiz, comprobar: true }).mensajes.join('\n')).toContain(
      'HU-01 escenario 3: está en docs/cobertura-escenarios.json pero no en docs/historias-de-usuario.md',
    );
  });
});
