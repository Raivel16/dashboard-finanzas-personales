import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// En desarrollo el cliente y la API comparten origen: Vite reenvía /api al servidor.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: { '/api': { target: env.VITE_API_URL || 'http://localhost:3000', changeOrigin: true } },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.js'],
      css: false,
      include: ['tests/**/*.test.{js,jsx}'],
      // Las pruebas de interfaz escriben y hacen clic: con la máquina cargada 5 s no alcanzan.
      testTimeout: 20000,
    },
  };
});
