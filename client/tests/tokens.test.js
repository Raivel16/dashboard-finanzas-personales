import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLORES } from '../src/shared/utils/tokens.js';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const aKebab = (texto) => texto.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);

describe('tokens de DESIGN.md', () => {
  it.each(Object.entries(COLORES))('el color %s de tokens.js coincide con index.css', (nombre, valor) => {
    const coincidencia = css.match(new RegExp(`--color-${aKebab(nombre)}:\\s*(#[0-9a-fA-F]{6})`));
    expect(coincidencia, `falta --color-${aKebab(nombre)} en index.css`).not.toBeNull();
    expect(coincidencia[1].toLowerCase()).toBe(valor.toLowerCase());
  });

  it('define foco visible y respeta prefers-reduced-motion', () => {
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
