// Jest en modo ES Modules (se ejecuta con NODE_OPTIONS=--experimental-vm-modules, ver el script "test").
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // mongodb-memory-server descarga mongod la primera vez; el tiempo extra evita falsos fallos.
  testTimeout: 120000,
  // Cada suite levanta su propio MongoDB en memoria: con demasiadas a la vez alguna no arranca a tiempo.
  maxWorkers: '50%',
};
