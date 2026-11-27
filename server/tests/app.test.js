import request from 'supertest';
import { crearEsquemaMovimiento, esquemaConsultaMovimientos } from '@finanzas/shared';
import { crearApp } from '../src/app.js';
import { validarConsulta, validarCuerpo } from '../src/middlewares/validacion.middleware.js';
import { NotFoundError } from '../src/utils/errores.js';
import { cuerpoExito, cuerpoLista } from '../src/views/respuesta.view.js';
import { configPrueba } from './helpers/entorno.js';

const config = configPrueba();
const ORIGEN = config.clientUrl;

// Rutas de prueba que ejercitan el contrato de la API sin depender de un recurso real.
const app = crearApp({
  config,
  extras: (api) => {
    api.get('/prueba/falla', () => {
      throw new Error('contraseña de la base: secreto-interno');
    });
    api.get('/prueba/falla-async', async () => {
      throw new Error('falla asíncrona');
    });
    api.get('/prueba/ajeno', () => {
      throw new NotFoundError();
    });
    api.post(
      '/prueba/movimientos',
      validarCuerpo(crearEsquemaMovimiento({ hoy: '2026-11-18' })),
      (req, res) => res.status(201).json(cuerpoExito(req.datos)),
    );
    api.get('/prueba/lista', validarConsulta(esquemaConsultaMovimientos), (req, res) => {
      const { page, limit } = req.consulta;
      const total = 45;
      const items = Array.from({ length: Math.min(limit, total - (page - 1) * limit) }, (_, i) => i);
      res.json({ ...cuerpoLista(items, { page, limit, total }), filtros: req.consulta });
    });
  },
});

describe('seguridad HTTP y CORS', () => {
  it('envía cabeceras de seguridad y no revela Express', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('permite solo el origen del cliente y con credenciales', async () => {
    const permitido = await request(app).get('/api/v1/health').set('Origin', ORIGEN);
    expect(permitido.headers['access-control-allow-origin']).toBe(ORIGEN);
    expect(permitido.headers['access-control-allow-credentials']).toBe('true');

    const ajeno = await request(app).get('/api/v1/health').set('Origin', 'https://sitio-malicioso.example');
    expect(ajeno.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde la solicitud previa (preflight) del origen permitido', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', ORIGEN)
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGEN);
  });
});

describe('errores (contrato-api)', () => {
  it('Error interno sin filtrar detalles: 500 INTERNAL_ERROR genérico', async () => {
    for (const ruta of ['/api/v1/prueba/falla', '/api/v1/prueba/falla-async']) {
      const res = await request(app).get(ruta);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. Inténtalo nuevamente.' },
      });
      expect(JSON.stringify(res.body)).not.toMatch(/secreto-interno|stack|at /);
    }
  });

  it('Recurso inexistente o de otro usuario: ambos responden el mismo 404 NOT_FOUND', async () => {
    const ajeno = await request(app).get('/api/v1/prueba/ajeno');
    const inexistente = await request(app).get('/api/v1/no-existe');
    expect(ajeno.status).toBe(404);
    expect(inexistente.status).toBe(404);
    expect(ajeno.body).toEqual(inexistente.body);
    expect(ajeno.body.error.code).toBe('NOT_FOUND');
  });

  it('rechaza un JSON mal formado con 400 sin filtrar detalles internos', async () => {
    const res = await request(app)
      .post('/api/v1/prueba/movimientos')
      .set('Content-Type', 'application/json')
      .send('{"monto": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Error de validación con detalle por campo: monto 0 y fecha ausente', async () => {
    const res = await request(app).post('/api/v1/prueba/movimientos').send({
      tipo: 'gasto',
      monto: 0,
      categoriaId: '0b9c1f6e-4a2d-4c8e-9f1a-2b3c4d5e6f70',
      cuentaId: '0b9c1f6e-4a2d-4c8e-9f1a-2b3c4d5e6f70',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.campo)).toEqual(['monto', 'fecha']);
  });

  it('acepta un cuerpo válido y devuelve el monto como texto con 2 decimales', async () => {
    const res = await request(app).post('/api/v1/prueba/movimientos').send({
      tipo: 'gasto',
      monto: 150,
      fecha: '2026-11-18',
      categoriaId: '0b9c1f6e-4a2d-4c8e-9f1a-2b3c4d5e6f70',
      cuentaId: '0b9c1f6e-4a2d-4c8e-9f1a-2b3c4d5e6f70',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.monto).toBe('150.00');
  });
});

describe('paginación y filtros (contrato-api)', () => {
  it('Listado paginado con valores por defecto', async () => {
    const res = await request(app).get('/api/v1/prueba/lista');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 45, totalPages: 3 });
  });

  it('entrega la última página incompleta', async () => {
    const res = await request(app).get('/api/v1/prueba/lista?page=3');
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta.page).toBe(3);
  });

  it('Filtros combinados y orden', async () => {
    const res = await request(app).get(
      '/api/v1/prueba/lista?desde=2026-08-01&hasta=2026-08-31&tipo=gasto&sort=-fecha',
    );
    expect(res.status).toBe(200);
    expect(res.body.filtros).toMatchObject({
      desde: '2026-08-01',
      hasta: '2026-08-31',
      tipo: 'gasto',
      sort: '-fecha',
    });
  });

  it('Límite superior de página: limit=500 responde 400 indicando el máximo', async () => {
    const res = await request(app).get('/api/v1/prueba/lista?limit=500');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatchObject({ campo: 'limit' });
    expect(res.body.error.details[0].mensaje).toContain('100');
  });

  it('Fecha con formato inválido: indica el parámetro desde', async () => {
    const res = await request(app).get('/api/v1/prueba/lista?desde=31-08-2026');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { campo: 'desde', mensaje: 'La fecha debe tener el formato AAAA-MM-DD' },
    ]);
  });
});

describe('respuesta exitosa con formato estándar', () => {
  it('envuelve los datos en { data } y los montos viajan como texto con su moneda', () => {
    expect(cuerpoExito({ saldo: '1250.50', moneda: 'PEN' })).toEqual({
      data: { saldo: '1250.50', moneda: 'PEN' },
    });
  });
});
