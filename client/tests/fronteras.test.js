// Fronteras de dominio (task 6.7): se verifican con la API de ESLint contra la configuración real.
import { resolve } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// Vitest se ejecuta desde client/: la raíz del monorepo está un nivel arriba.
const RAIZ = resolve(process.cwd(), '..');
const eslint = new ESLint({ cwd: RAIZ, cache: false });

async function mensajes(rutaArchivo, codigo) {
  const [resultado] = await eslint.lintText(codigo, { filePath: rutaArchivo });
  return resultado.messages.filter((m) => m.ruleId === 'no-restricted-imports');
}

describe('fronteras de la Screaming Architecture', { timeout: 30_000 }, () => {
  it('un dominio no puede importar archivos internos de otro dominio', async () => {
    const m = await mensajes(
      'client/src/inicio/hooks/prueba.js',
      "import { FilaMovimiento } from '../../movimientos/components/FilaMovimiento.jsx';\nexport const x = FilaMovimiento;\n",
    );
    expect(m).toHaveLength(1);
    expect(m[0].message).toMatch(/index\.js/);
  });

  it('un dominio sí puede importar el index.js de otro dominio y de shared', async () => {
    const m = await mensajes(
      'client/src/inicio/hooks/prueba.js',
      "import { MovimientosPage } from '../../movimientos/index.js';\nimport { api } from '../../shared/api/clienteHttp.js';\nexport const x = [MovimientosPage, api];\n",
    );
    expect(m).toHaveLength(0);
  });

  it('shared no puede importar de ningún dominio', async () => {
    const m = await mensajes(
      'client/src/shared/utils/prueba.js',
      "import { InicioPage } from '../../inicio/index.js';\nexport const x = InicioPage;\n",
    );
    expect(m).toHaveLength(1);
    expect(m[0].message).toMatch(/shared\//);
  });

  it('un dominio no puede importar el router', async () => {
    const m = await mensajes(
      'client/src/inicio/hooks/prueba.js',
      "import { crearRutas } from '../../router/index.jsx';\nexport const x = crearRutas;\n",
    );
    expect(m).toHaveLength(1);
  });

  it('el router solo importa dominios por su index.js', async () => {
    const malo = await mensajes(
      'client/src/router/prueba.jsx',
      "import { InicioPage } from '../inicio/pages/InicioPage.jsx';\nexport const x = InicioPage;\n",
    );
    const bueno = await mensajes(
      'client/src/router/prueba.jsx',
      "import { InicioPage } from '../inicio/index.js';\nexport const x = InicioPage;\n",
    );
    expect(malo).toHaveLength(1);
    expect(bueno).toHaveLength(0);
  });
});
