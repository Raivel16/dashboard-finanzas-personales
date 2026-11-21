import { describe, expect, it, vi } from 'vitest';
import { ErrorApi, api, solicitar } from '../src/shared/api/clienteHttp.js';

const respuesta = (estado, cuerpo) => ({
  ok: estado >= 200 && estado < 300,
  status: estado,
  text: async () =>
    cuerpo === undefined ? '' : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
});

describe('cliente HTTP', () => {
  it('devuelve data y meta de una respuesta exitosa y llama a /api/v1 con credenciales', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuesta(200, { data: { api: 'ok' }, meta: { total: 1 } }));
    const resultado = await solicitar('/health', { fetchImpl });
    expect(resultado).toEqual({ data: { api: 'ok' }, meta: { total: 1 } });
    const [url, opciones] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/v1/health');
    expect(opciones).toMatchObject({ method: 'GET', credentials: 'include' });
  });

  it('serializa el cuerpo como JSON y arma la consulta sin valores vacíos', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuesta(200, { data: null }));
    await solicitar('/movimientos', {
      metodo: 'POST',
      cuerpo: { monto: '10.00' },
      consulta: { page: 2, texto: '', tipo: undefined },
      fetchImpl,
    });
    const [url, opciones] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/v1/movimientos?page=2');
    expect(opciones.body).toBe('{"monto":"10.00"}');
    expect(opciones.headers['Content-Type']).toBe('application/json');
  });

  it('convierte el error del contrato en un ErrorApi con código, mensaje y detalles', async () => {
    const cuerpo = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: [{ campo: 'monto', mensaje: 'Monto inválido' }],
      },
    };
    const fetchImpl = vi.fn().mockResolvedValue(respuesta(400, cuerpo));
    const error = await solicitar('/x', { fetchImpl }).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ estado: 400, codigo: 'VALIDATION_ERROR', message: 'Datos inválidos' });
    expect(error.mensajeDe('monto')).toBe('Monto inválido');
    expect(error.mensajeDe('otro')).toBeUndefined();
  });

  it('usa un mensaje genérico si la respuesta de error no es JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuesta(502, '<html>Bad gateway</html>'));
    const error = await solicitar('/x', { fetchImpl }).catch((e) => e);
    expect(error).toMatchObject({ estado: 502, codigo: 'INTERNAL_ERROR' });
    expect(error.message).toMatch(/error inesperado/i);
  });

  it('informa una falla de red en español', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await solicitar('/x', { fetchImpl }).catch((e) => e);
    expect(error).toMatchObject({ estado: 0, codigo: 'NETWORK_ERROR' });
    expect(error.message).toMatch(/No se pudo conectar/);
  });

  it('deja pasar el AbortError para que los hooks lo ignoren', async () => {
    const abortado = Object.assign(new Error('abortado'), { name: 'AbortError' });
    const fetchImpl = vi.fn().mockRejectedValue(abortado);
    await expect(solicitar('/x', { fetchImpl })).rejects.toBe(abortado);
  });

  it('expone atajos por método HTTP', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(respuesta(200, { data: 1 }));
    try {
      await api.delete('/cuentas/1');
      expect(globalThis.fetch.mock.calls[0][1].method).toBe('DELETE');
    } finally {
      globalThis.fetch = original;
    }
  });
});
