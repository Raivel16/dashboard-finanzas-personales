// HU-19 · Renovación automática de la sesión en el cliente HTTP.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorApi, configurarSesionHttp, solicitar } from '../src/shared/api/clienteHttp.js';

const respuesta = (estado, cuerpo) => ({
  ok: estado >= 200 && estado < 300,
  status: estado,
  text: async () => JSON.stringify(cuerpo),
});
const error = (estado, code, message = 'x') => respuesta(estado, { error: { code, message } });
const exito = (data = { ok: true }) => respuesta(200, { data });

afterEach(() => configurarSesionHttp());

describe('renovación de la sesión', () => {
  it('ante TOKEN_EXPIRED renueva una vez y repite la solicitud', async () => {
    const renovar = vi.fn().mockResolvedValue();
    configurarSesionHttp({ renovar });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(error(401, 'TOKEN_EXPIRED'))
      .mockResolvedValueOnce(exito());

    const res = await solicitar('/algo', { fetchImpl });
    expect(res.data).toEqual({ ok: true });
    expect(renovar).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('dos solicitudes simultáneas provocan una sola renovación', async () => {
    let terminar;
    const renovar = vi.fn(() => new Promise((resolver) => (terminar = resolver)));
    configurarSesionHttp({ renovar });
    const fetchImpl = vi.fn(async (url, opciones) => {
      void opciones;
      return fetchImpl.mock.calls.length <= 2 ? error(401, 'TOKEN_EXPIRED') : exito({ url });
    });

    const a = solicitar('/a', { fetchImpl });
    const b = solicitar('/b', { fetchImpl });
    await vi.waitFor(() => expect(renovar).toHaveBeenCalled());
    terminar();
    const [ra, rb] = await Promise.all([a, b]);

    expect(renovar).toHaveBeenCalledTimes(1);
    expect(ra.data.url).toBe('/api/v1/a');
    expect(rb.data.url).toBe('/api/v1/b');
  });

  it('una renovación fallida no reintenta en bucle: avisa que la sesión terminó y propaga el error', async () => {
    const falla = new ErrorApi({ estado: 401, codigo: 'SESSION_EXPIRED', mensaje: 'Tu sesión ha expirado' });
    const renovar = vi.fn().mockRejectedValue(falla);
    const alSesionTerminada = vi.fn();
    configurarSesionHttp({ renovar, alSesionTerminada });
    const fetchImpl = vi.fn().mockResolvedValue(error(401, 'TOKEN_EXPIRED'));

    await expect(solicitar('/algo', { fetchImpl })).rejects.toBe(falla);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(renovar).toHaveBeenCalledTimes(1);
    expect(alSesionTerminada).toHaveBeenCalledWith(falla);
  });

  it('si tras renovar vuelve a vencer, no renueva otra vez', async () => {
    const renovar = vi.fn().mockResolvedValue();
    configurarSesionHttp({ renovar });
    const fetchImpl = vi.fn().mockResolvedValue(error(401, 'TOKEN_EXPIRED'));

    await expect(solicitar('/algo', { fetchImpl })).rejects.toMatchObject({ codigo: 'TOKEN_EXPIRED' });
    expect(renovar).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('SESSION_EXPIRED y SESSION_REVOKED notifican el fin de la sesión sin renovar', async () => {
    const renovar = vi.fn();
    const alSesionTerminada = vi.fn();
    configurarSesionHttp({ renovar, alSesionTerminada });

    for (const code of ['SESSION_EXPIRED', 'SESSION_REVOKED']) {
      const fetchImpl = vi.fn().mockResolvedValue(error(401, code));
      await expect(solicitar('/algo', { fetchImpl })).rejects.toMatchObject({ codigo: code });
    }
    expect(renovar).not.toHaveBeenCalled();
    expect(alSesionTerminada).toHaveBeenCalledTimes(2);
  });

  it('con sinRenovar (login, refresh, logout) no intenta renovar ni notifica', async () => {
    const renovar = vi.fn();
    const alSesionTerminada = vi.fn();
    configurarSesionHttp({ renovar, alSesionTerminada });
    const fetchImpl = vi.fn().mockResolvedValue(error(401, 'TOKEN_EXPIRED'));

    await expect(solicitar('/auth/login', { fetchImpl, sinRenovar: true })).rejects.toBeInstanceOf(ErrorApi);
    expect(renovar).not.toHaveBeenCalled();
    expect(alSesionTerminada).not.toHaveBeenCalled();
  });

  it('sin configurar la sesión, los errores se propagan como antes', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(error(401, 'TOKEN_EXPIRED'));
    await expect(solicitar('/algo', { fetchImpl })).rejects.toMatchObject({ codigo: 'TOKEN_EXPIRED' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
