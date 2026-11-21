import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import { readdirSync } from 'node:fs';

// Fronteras de la Screaming Architecture (RT-05): los dominios son las carpetas de client/src salvo
// router/ y shared/. Se generan desde el disco, así un dominio nuevo queda protegido sin tocar nada.
const CARPETAS_TRANSVERSALES = ['router', 'shared'];
const dominios = readdirSync(new URL('./client/src', import.meta.url), { withFileTypes: true })
  .filter((e) => e.isDirectory() && !CARPETAS_TRANSVERSALES.includes(e.name))
  .map((e) => e.name);

const soloIndex = (dominio) => ({
  group: [`**/${dominio}/**`, `!**/${dominio}/index.js`],
  message: `Importa el dominio "${dominio}" solo por su index.js (API pública), nunca por sus archivos internos.`,
});
const ningunDominio = (dominio) => ({
  group: [`**/${dominio}`, `**/${dominio}/**`],
  message: `shared/ no puede importar del dominio "${dominio}": las dependencias van de los dominios hacia shared/.`,
});
const sinRouter = {
  group: ['**/router', '**/router/**'],
  message:
    'Solo App.jsx y main.jsx conocen el router; las rutas se declaran únicamente en client/src/router/.',
};
const restringir = (patterns) => ({ 'no-restricted-imports': ['error', { patterns }] });

export const reglasFronteras = [
  ...dominios.map((dominio) => ({
    files: [`client/src/${dominio}/**/*.{js,jsx}`],
    rules: restringir([...dominios.filter((o) => o !== dominio).map(soloIndex), sinRouter]),
  })),
  {
    files: ['client/src/shared/**/*.{js,jsx}'],
    rules: restringir([...dominios.map(ningunDominio), sinRouter]),
  },
  { files: ['client/src/router/**/*.{js,jsx}'], rules: restringir(dominios.map(soloIndex)) },
];

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'docs/**',
      'openspec/**',
      '.claude/**',
      '.agents/**',
      '.impeccable/**',
    ],
  },
  js.configs.recommended,
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } } },
  {
    files: ['**/*.test.js', '**/*.test.jsx', '**/tests/**'],
    languageOptions: { globals: { ...globals.jest } },
  },
  {
    files: ['client/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser }, parserOptions: { ecmaFeatures: { jsx: true } } },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
    },
  },
  ...reglasFronteras,
  prettier,
];
