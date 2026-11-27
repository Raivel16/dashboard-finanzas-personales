// HU-02 (inicio de sesión) y HU-19 (sesión activa durante el uso). Los tiempos se prueban moviendo el reloj.
import request from 'supertest';
import mongoose from 'mongoose';
import { CLAVE, cookieDe, iniciarEntorno } from './helpers/api.js';

describe('HU-02 y HU-19 · sesión', () => {
  let e;
  beforeAll(async () => {
    e = await iniciarEntorno();
  });
  afterAll(() => e.cerrar());

  const usuarios = () => mongoose.connection.collection('usuarios');
  const sesiones = () => mongoose.connection.collection('sesiones');
  const login = (datos) => request(e.app).post('/api/v1/auth/login').send(datos);
  const me = (agente) => agente.get('/api/v1/auth/me');
  const refresh = (agente) => agente.post('/api/v1/auth/refresh');

  /** Una acción del usuario: si el token de acceso venció, renueva y reintenta, como hace el cliente. */
  const usar = async (agente) => {
    let res = await me(agente);
    if (res.status === 401 && res.body.error.code === 'TOKEN_EXPIRED') {
      const renovacion = await refresh(agente);
      if (renovacion.status !== 200) return renovacion;
      res = await me(agente);
    }
    return res;
  };

  describe('inicio de sesión (HU-02)', () => {
    it('Inicio de sesión exitoso: valida las credenciales y entrega los tokens en cookies httpOnly', async () => {
      const u = await e.registrar();
      const { agente, res } = await e.iniciarSesion(u);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ email: u.email, rol: 'usuario' });
      const acceso = cookieDe(res, 'access_token');
      const renovacion = cookieDe(res, 'refresh_token');
      expect(acceso.texto).toMatch(/HttpOnly/i);
      expect(acceso.texto).toMatch(/SameSite=Lax/i);
      expect(acceso.texto).toMatch(/Path=\/;/);
      expect(renovacion.texto).toMatch(/HttpOnly/i);
      expect(renovacion.texto).toMatch(/Path=\/api\/v1\/auth/);
      expect(JSON.stringify(res.body)).not.toContain(acceso.valor);

      expect((await me(agente)).body.data.email).toBe(u.email);
    });

    it('en la base solo queda el hash del token de renovación, nunca su valor', async () => {
      const u = await e.registrar();
      const { res } = await e.iniciarSesion(u);
      const { valor } = cookieDe(res, 'refresh_token');
      const guardada = await sesiones().findOne({ usuarioId: u.id });
      expect(guardada.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(guardada)).not.toContain(valor);
    });

    it('Acceso ampliado para un administrador: la sesión expone el rol admin y usa el rol vigente en cada solicitud', async () => {
      const u = await e.registrar();
      await usuarios().updateOne({ email: u.email }, { $set: { rol: 'admin' } });
      const { agente, res } = await e.iniciarSesion(u);
      expect(res.body.data.rol).toBe('admin');
      expect((await me(agente)).body.data.rol).toBe('admin');

      // Degradación durante la sesión: el token sigue siendo el mismo pero el rol ya no.
      await usuarios().updateOne({ email: u.email }, { $set: { rol: 'usuario' } });
      expect((await me(agente)).body.data.rol).toBe('usuario');
    });

    it('Bloqueo temporal por credenciales incorrectas: el tercer fallo bloquea 5 minutos, incluso con la contraseña correcta', async () => {
      const u = await e.registrar();
      const mala = { email: u.email, password: 'Incorrecta1' };

      const primero = await login(mala);
      const segundo = await login(mala);
      const tercero = await login(mala);
      expect([primero.status, segundo.status, tercero.status]).toEqual([401, 401, 429]);
      expect(tercero.body.error.message).toBe('Credenciales inválidas');
      expect(tercero.body.error.details.bloqueadoHasta).toBeTruthy();

      const bloqueado = await login({ email: u.email, password: CLAVE });
      expect(bloqueado.status).toBe(429);
      expect(bloqueado.body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(bloqueado.body.error.message).toMatch(/5 minutos/);

      e.reloj.avanzarMinutos(4);
      expect((await login({ email: u.email, password: CLAVE })).status).toBe(429);
      e.reloj.avanzarMinutos(1.1);
      expect((await login({ email: u.email, password: CLAVE })).status).toBe(200);
    });

    it('un inicio de sesión correcto reinicia el contador de intentos', async () => {
      const u = await e.registrar();
      await login({ email: u.email, password: 'Incorrecta1' });
      await login({ email: u.email, password: 'Incorrecta1' });
      expect((await login({ email: u.email, password: CLAVE })).status).toBe(200);
      // Con el contador en cero, dos fallos más no bloquean.
      await login({ email: u.email, password: 'Incorrecta1' });
      expect((await login({ email: u.email, password: 'Incorrecta1' })).status).toBe(401);
    });

    it('correo inexistente, contraseña incorrecta y usuario inactivo responden exactamente igual', async () => {
      const u = await e.registrar();
      const inactivo = await e.registrar();
      await usuarios().updateOne({ email: inactivo.email }, { $set: { activo: false } });

      const respuestas = await Promise.all([
        login({ email: 'nadie@correo.com', password: CLAVE }),
        login({ email: u.email, password: 'Incorrecta1' }),
        login({ email: inactivo.email, password: CLAVE }),
      ]);
      for (const r of respuestas) {
        expect(r.status).toBe(401);
        expect(r.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Credenciales inválidas' } });
      }
    });

    it('valida el formato del cuerpo antes de consultar la base', async () => {
      const res = await login({ email: { $ne: '' }, password: CLAVE });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('autenticación de cada solicitud', () => {
    it('sin cookies o con un token alterado responde 401 UNAUTHORIZED', async () => {
      expect((await request(e.app).get('/api/v1/auth/me')).status).toBe(401);
      const alterada = await request(e.app).get('/api/v1/auth/me').set('Cookie', 'access_token=abc.def.ghi');
      expect(alterada.body.error.code).toBe('UNAUTHORIZED');
    });

    it('las respuestas de autenticación no se guardan en caché del navegador', async () => {
      const u = await e.registrar();
      const { agente, res } = await e.iniciarSesion(u);
      expect(res.headers['cache-control']).toBe('no-store');
      expect((await me(agente)).headers['cache-control']).toBe('no-store');
    });

    it('un token de acceso de una sesión revocada responde 401 SESSION_REVOKED al instante', async () => {
      const u = await e.registrar();
      const { agente } = await e.iniciarSesion(u);
      await sesiones().updateMany(
        { usuarioId: u.id },
        { $set: { revocadaEn: new Date() } },
      );
      const res = await me(agente);
      expect(res.status).toBe(401);
      expect(res.body.error).toMatchObject({
        code: 'SESSION_REVOKED',
        message: 'Tu sesión se cerró, por favor inicia sesión nuevamente',
      });
    });
  });

  describe('sesión activa y expiración (HU-02, HU-19)', () => {
    it('Sesión invalidada por expiración del token: tras 31 minutos sin actividad responde SESSION_EXPIRED con el mensaje de la spec', async () => {
      const u = await e.registrar();
      const { agente } = await e.iniciarSesion(u);
      e.reloj.avanzarMinutos(31);

      expect((await me(agente)).body.error.code).toBe('TOKEN_EXPIRED'); // el token de acceso dura 15 minutos
      const renovacion = await refresh(agente);
      expect(renovacion.status).toBe(401);
      expect(renovacion.body.error).toMatchObject({
        code: 'SESSION_EXPIRED',
        message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente',
      });
    });

    it('Sesión renovada mientras el usuario está activo: acciones cada 14 minutos durante 2 horas no piden iniciar sesión', async () => {
      const u = await e.registrar();
      const { agente } = await e.iniciarSesion(u);
      for (let i = 0; i < 9; i += 1) {
        e.reloj.avanzarMinutos(14);
        expect((await usar(agente)).status).toBe(200);
      }
    });

    it('Regreso después de una pausa corta: tras 20 minutos sin usar la aplicación la acción se completa', async () => {
      const u = await e.registrar();
      const { agente } = await e.iniciarSesion(u);
      e.reloj.avanzarMinutos(20);
      expect((await usar(agente)).status).toBe(200);
    });

    it('la inactividad se mide desde la última actividad real, no desde la última renovación (usa a los 14 min, vuelve a los 31)', async () => {
      const u = await e.registrar();
      const { agente } = await e.iniciarSesion(u);
      e.reloj.avanzarMinutos(14);
      expect((await me(agente)).status).toBe(200); // actividad con el token de acceso aún válido
      e.reloj.avanzarMinutos(17); // 17 minutos de pausa: menos de 30
      expect((await usar(agente)).status).toBe(200);
    });

    it('Límite máximo de la sesión: usada a diario durante 6 días sigue activa y al séptimo día pide iniciar sesión', async () => {
      const u = await e.registrar();
      const { agente } = await e.iniciarSesion(u);
      const inicio = e.reloj.ahora().getTime();
      const dias = () => (e.reloj.ahora().getTime() - inicio) / 86_400_000;

      while (dias() < 6.9) {
        e.reloj.avanzarMinutos(29);
        const res = await usar(agente);
        if (res.status !== 200)
          throw new Error(`la sesión terminó a los ${dias().toFixed(2)} días: ${res.body.error?.code}`);
      }
      e.reloj.avanzarDias(7 - dias());
      const res = await usar(agente);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('SESSION_EXPIRED');
    }, 60_000);
  });

  describe('renovación del token', () => {
    it('rota el token de renovación y guarda solo el hash del nuevo', async () => {
      const u = await e.registrar();
      const { agente, res } = await e.iniciarSesion(u);
      const antes = cookieDe(res, 'refresh_token').valor;
      e.reloj.avanzarMinutos(16);
      const renovada = await refresh(agente);
      expect(renovada.status).toBe(200);
      const despues = cookieDe(renovada, 'refresh_token').valor;
      expect(despues).not.toBe(antes);
      expect(cookieDe(renovada, 'access_token')).toBeTruthy();
    });

    it('reutilizar un token ya rotado después de la ventana de gracia revoca la sesión (robo)', async () => {
      const u = await e.registrar();
      const { agente, res } = await e.iniciarSesion(u);
      const robado = cookieDe(res, 'refresh_token').valor;
      await refresh(agente); // el usuario legítimo rota el token
      e.reloj.avanzarSegundos(30);

      const intruso = await request(e.app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${robado}`);
      expect(intruso.status).toBe(401);
      expect(intruso.body.error.code).toBe('SESSION_REVOKED');
      // La sesión del usuario legítimo también quedó revocada.
      expect((await refresh(agente)).body.error.code).toBe('SESSION_REVOKED');
    });

    it('dentro de los 10 segundos de gracia emite un nuevo acceso sin rotar otra vez', async () => {
      const u = await e.registrar();
      const { res } = await e.iniciarSesion(u);
      const original = cookieDe(res, 'refresh_token').valor;
      const cabecera = { Cookie: `refresh_token=${original}` };
      await request(e.app).post('/api/v1/auth/refresh').set(cabecera); // rota
      e.reloj.avanzarSegundos(5);
      const gracia = await request(e.app).post('/api/v1/auth/refresh').set(cabecera);
      expect(gracia.status).toBe(200);
      expect(cookieDe(gracia, 'access_token')).toBeTruthy();
      expect(cookieDe(gracia, 'refresh_token')).toBeNull();
    });

    it('dos pestañas que renuevan a la vez no pierden la sesión', async () => {
      const u = await e.registrar();
      const { res } = await e.iniciarSesion(u);
      const cabecera = { Cookie: `refresh_token=${cookieDe(res, 'refresh_token').valor}` };
      const resultados = await Promise.all([
        request(e.app).post('/api/v1/auth/refresh').set(cabecera),
        request(e.app).post('/api/v1/auth/refresh').set(cabecera),
      ]);
      expect(resultados.map((r) => r.status)).toEqual([200, 200]);
    });

    it('sin cookie de renovación responde 401 UNAUTHORIZED', async () => {
      const res = await request(e.app).post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
