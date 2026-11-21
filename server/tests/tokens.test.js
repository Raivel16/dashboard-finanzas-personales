import { crearRelojManual, relojSistema, sumarDias, sumarMinutos } from '../src/utils/reloj.js';
import {
  firmarTokenAcceso,
  generarTokenOpaco,
  hashToken,
  verificarTokenAcceso,
} from '../src/utils/tokens.js';

const config = { secreto: 'secreto-de-prueba-con-32-caracteres!!', ttl: '15m' };
const datos = { usuarioId: 'u1', tenantId: 't1', rol: 'usuario', sesionId: 's1' };

describe('reloj', () => {
  it('el reloj manual avanza solo cuando se le pide', () => {
    const reloj = crearRelojManual(new Date('2026-01-15T12:00:00.000Z'));
    reloj.avanzarMinutos(5);
    reloj.avanzarSegundos(30);
    reloj.avanzarDias(1);
    expect(reloj.ahora().toISOString()).toBe('2026-01-16T12:05:30.000Z');
  });

  it('el reloj del sistema devuelve la hora actual y los ayudantes suman', () => {
    expect(Math.abs(relojSistema.ahora() - new Date())).toBeLessThan(1000);
    const base = new Date('2026-01-01T00:00:00.000Z');
    expect(sumarMinutos(base, 30).toISOString()).toBe('2026-01-01T00:30:00.000Z');
    expect(sumarDias(base, 7).toISOString()).toBe('2026-01-08T00:00:00.000Z');
  });
});

describe('tokens opacos', () => {
  it('generan valores distintos de 43 caracteres base64url', () => {
    const a = generarTokenOpaco();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generarTokenOpaco()).not.toBe(a);
  });

  it('el hash es determinista, no contiene el valor y tiene 64 hex', () => {
    const valor = generarTokenOpaco();
    expect(hashToken(valor)).toBe(hashToken(valor));
    expect(hashToken(valor)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(valor)).not.toContain(valor);
  });
});

describe('token de acceso', () => {
  it('se firma y se lee con el usuario, el inquilino, el rol y la sesión', () => {
    const reloj = crearRelojManual();
    const token = firmarTokenAcceso(datos, config, reloj.ahora());
    expect(verificarTokenAcceso(token, config, reloj.ahora())).toEqual(datos);
  });

  it('vence a los 15 minutos según el reloj inyectado (TOKEN_EXPIRED)', () => {
    const reloj = crearRelojManual();
    const token = firmarTokenAcceso(datos, config, reloj.ahora());
    reloj.avanzarMinutos(14);
    expect(() => verificarTokenAcceso(token, config, reloj.ahora())).not.toThrow();
    reloj.avanzarMinutos(2);
    expect(() => verificarTokenAcceso(token, config, reloj.ahora())).toThrow(
      expect.objectContaining({ estado: 401, codigo: 'TOKEN_EXPIRED' }),
    );
  });

  it('rechaza un token alterado, de otro secreto o ausente con UNAUTHORIZED', () => {
    const reloj = crearRelojManual();
    const token = firmarTokenAcceso(datos, config, reloj.ahora());
    const otro = firmarTokenAcceso(
      datos,
      { ...config, secreto: 'otro-secreto-distinto-de-32-caracteres!' },
      reloj.ahora(),
    );
    for (const malo of [`${token}x`, otro, 'no.es.jwt', undefined]) {
      expect(() => verificarTokenAcceso(malo, config, reloj.ahora())).toThrow(
        expect.objectContaining({ estado: 401, codigo: 'UNAUTHORIZED' }),
      );
    }
  });
});
