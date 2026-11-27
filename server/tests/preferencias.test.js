// HU-32 · Elegir el idioma de la aplicación y HU-33 · Usar la aplicación de forma accesible (preferencias-usuario),
// sobre la API. El reloj marca el 2026-01-15.
import request from 'supertest';
import * as XLSX from 'xlsx';
import { iniciarEntorno } from './helpers/api.js';

const binario = (res, cb) => {
  const trozos = [];
  res.on('data', (t) => trozos.push(t));
  res.on('end', () => cb(null, Buffer.concat(trozos)));
};

describe('preferencias de idioma y accesibilidad', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const sesionIniciada = async (extra) => {
    const u = await e.registrar(extra);
    const { agente } = await e.iniciarSesion(u);
    return { u, agente };
  };
  const correosPara = (email) =>
    e.transporte.sendMail.mock.calls.map(([c]) => c).filter((c) => c.to === email);

  describe('HU-32 · idioma', () => {
    it('Cambio del idioma a inglés: se guarda en el perfil y se conserva al volver a iniciar sesión', async () => {
      const { u, agente } = await sesionIniciada();
      expect((await agente.get('/api/v1/auth/me')).body.data.idioma).toBe('es');

      const res = await agente.patch('/api/v1/perfil/preferencias').send({ idioma: 'en' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ idioma: 'en', nombre: u.nombre });

      await agente.post('/api/v1/auth/logout');
      const { agente: otraVez } = await e.iniciarSesion(u);
      expect((await otraVez.get('/api/v1/auth/me')).body.data.idioma).toBe('en');
    });

    it('Idioma antes de iniciar sesión: sin sesión la API responde en el idioma del navegador', async () => {
      const u = await e.registrar();
      const login = (idioma) =>
        request(e.app)
          .post('/api/v1/auth/login')
          .set('Accept-Language', idioma)
          .send({ email: u.email, password: 'Incorrecta1' });
      expect((await login('en-US,en;q=0.9')).body.error.message).toBe('Invalid credentials');
      expect((await login('es-PE,es;q=0.9')).body.error.message).toBe('Credenciales inválidas');
    });

    it('Mensajes de error en el idioma elegido: un monto 0 se rechaza con el mensaje en inglés', async () => {
      const { agente } = await sesionIniciada();
      await agente.patch('/api/v1/perfil/preferencias').send({ idioma: 'en' });
      const cuenta = (
        await agente
          .post('/api/v1/cuentas')
          .send({ nombre: 'Cash', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '50' })
      ).body.data;
      const categoria = (await agente.get('/api/v1/categorias?limit=100')).body.data.find(
        (c) => c.tipo === 'gasto',
      );

      const res = await agente
        .post('/api/v1/movimientos')
        .send({
          tipo: 'gasto',
          monto: '0',
          fecha: '2026-01-10',
          cuentaId: cuenta.id,
          categoriaId: categoria.id,
        });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('The submitted data is not valid');
      expect(res.body.error.details).toContainEqual({
        campo: 'monto',
        mensaje: 'The amount must be greater than 0, with up to 2 decimals',
      });
      // Con la preferencia en español, la misma solicitud responde en español aunque el navegador esté en inglés.
      await agente.patch('/api/v1/perfil/preferencias').send({ idioma: 'es' });
      const enEspanol = await agente
        .post('/api/v1/movimientos')
        .set('Accept-Language', 'en')
        .send({
          tipo: 'gasto',
          monto: '0',
          fecha: '2026-01-10',
          cuentaId: cuenta.id,
          categoriaId: categoria.id,
        });
      expect(enEspanol.body.error.details[0].mensaje).toBe(
        'El monto debe ser mayor a 0, con hasta 2 decimales',
      );
    });

    it('traduce también las advertencias y los mensajes de éxito', async () => {
      const { agente } = await sesionIniciada({ idioma: 'en' });
      const cuenta = (
        await agente
          .post('/api/v1/cuentas')
          .send({ nombre: 'Cash', tipo: 'efectivo', moneda: 'PEN', saldoInicial: '5' })
      ).body.data;
      const categoria = (await agente.get('/api/v1/categorias?limit=100')).body.data.find(
        (c) => c.tipo === 'gasto',
      );
      const res = await agente
        .post('/api/v1/movimientos')
        .send({
          tipo: 'gasto',
          monto: '20',
          fecha: '2026-01-10',
          cuentaId: cuenta.id,
          categoriaId: categoria.id,
        });
      expect(res.body.meta.advertencias).toEqual(['The amount exceeds the available balance of the account']);
    });

    it('Correos y reportes en el idioma elegido: el correo de recuperación llega en inglés', async () => {
      const u = await e.registrar({ idioma: 'en' });
      expect(correosPara(u.email).at(-1).subject).toBe('Welcome to Personal Finances');
      await request(e.app).post('/api/v1/auth/olvide-contrasena').send({ email: u.email });
      await e.app.locals.servicios.recuperacion.esperarEnvios();
      const correo = correosPara(u.email).at(-1);
      expect(correo.subject).toBe('Reset your password');
      expect(correo.text).toMatch(/^Hi Ana Torres, we received a request to reset your password\./);
      expect(correo.html).toContain('Create a new password');
    });

    it('Correos y reportes en el idioma elegido: el PDF y el Excel salen en inglés con los nombres propios intactos', async () => {
      const { agente } = await sesionIniciada({ idioma: 'en' });
      const cuenta = (
        await agente
          .post('/api/v1/cuentas')
          .send({ nombre: 'Cuenta sueldo', tipo: 'banco', moneda: 'PEN', saldoInicial: '1000' })
      ).body.data;
      const propia = (
        await agente
          .post('/api/v1/categorias')
          .send({ nombre: 'Comida casera', tipo: 'gasto', icono: 'utensils' })
      ).body.data;
      await agente.post('/api/v1/movimientos').send({
        tipo: 'gasto',
        monto: '80',
        fecha: '2026-01-08',
        cuentaId: cuenta.id,
        categoriaId: propia.id,
        descripcion: 'Mercado del barrio',
      });

      const excel = await agente.get('/api/v1/reportes/movimientos.xlsx').buffer(true).parse(binario);
      const libro = XLSX.read(excel.body);
      expect(libro.SheetNames).toEqual(['Movements', 'Summary']);
      const filas = XLSX.utils.sheet_to_json(libro.Sheets.Movements, { header: 1 });
      expect(filas[0]).toEqual(['Date', 'Type', 'Category', 'Account', 'Currency', 'Amount', 'Description']);
      expect(filas[1]).toEqual([
        '2026-01-08',
        'Expense',
        'Comida casera',
        'Cuenta sueldo',
        'PEN',
        80,
        'Mercado del barrio',
      ]);
      expect(XLSX.utils.sheet_to_json(libro.Sheets.Summary, { header: 1 })[0]).toEqual([
        'Currency',
        'Type',
        'Category',
        'Count',
        'Total',
      ]);

      const pdf = (
        await agente.get('/api/v1/reportes/movimientos.pdf').buffer(true).parse(binario)
      ).body.toString('latin1');
      expect(pdf).toContain('Movements report');
      expect(pdf).toContain('Period: 2026-01-01 to 2026-01-31');
      expect(pdf).toContain('Comida casera');
      expect(pdf).not.toContain('Reporte de movimientos');
    });

    it('crea las categorías predeterminadas en el idioma de registro', async () => {
      const { agente } = await sesionIniciada({ idioma: 'en' });
      const nombres = (await agente.get('/api/v1/categorias?limit=100')).body.data.map((c) => c.nombre);
      expect(nombres).toEqual(expect.arrayContaining(['Food', 'Salary', 'Other expenses']));
      expect(nombres).not.toContain('Alimentación');
    });

    it('rechaza un idioma no admitido y una solicitud sin preferencias', async () => {
      const { agente } = await sesionIniciada();
      const invalido = await agente.patch('/api/v1/perfil/preferencias').send({ idioma: 'fr' });
      expect(invalido.status).toBe(400);
      expect(invalido.body.error.details).toEqual([
        { campo: 'idioma', mensaje: 'Selecciona un idioma válido' },
      ]);
      expect((await agente.patch('/api/v1/perfil/preferencias').send({})).status).toBe(400);
    });
  });

  describe('HU-33 · accesibilidad', () => {
    it('Texto grande y alto contraste: se guardan en el perfil y se conservan al volver a iniciar sesión', async () => {
      const { u, agente } = await sesionIniciada();
      expect((await agente.get('/api/v1/auth/me')).body.data).toMatchObject({
        textoGrande: false,
        altoContraste: false,
      });

      const res = await agente
        .patch('/api/v1/perfil/preferencias')
        .send({ textoGrande: true, altoContraste: true });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ textoGrande: true, altoContraste: true, idioma: 'es' });

      const { agente: otraVez } = await e.iniciarSesion(u);
      expect((await otraVez.get('/api/v1/auth/me')).body.data).toMatchObject({
        textoGrande: true,
        altoContraste: true,
      });
    });

    it('requiere sesión para cambiar las preferencias', async () => {
      expect(
        (await request(e.app).patch('/api/v1/perfil/preferencias').send({ textoGrande: true })).status,
      ).toBe(401);
    });
  });
});
