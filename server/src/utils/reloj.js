// Reloj inyectable: los servicios lo reciben para que las pruebas muevan el tiempo (5 minutos de bloqueo,
// 30 de inactividad, 7 días de sesión) sin esperar. En producción se usa el reloj del sistema.

export const relojSistema = Object.freeze({ ahora: () => new Date() });

/** Reloj controlable para pruebas: empieza en `inicio` y avanza solo cuando se le pide. */
export function crearRelojManual(inicio = new Date('2026-01-15T12:00:00.000Z')) {
  let actual = inicio.getTime();
  return {
    ahora: () => new Date(actual),
    avanzarMinutos: (minutos) => {
      actual += minutos * 60_000;
    },
    avanzarSegundos: (segundos) => {
      actual += segundos * 1000;
    },
    avanzarDias: (dias) => {
      actual += dias * 86_400_000;
    },
  };
}

export const sumarMinutos = (fecha, minutos) => new Date(fecha.getTime() + minutos * 60_000);
export const sumarDias = (fecha, dias) => new Date(fecha.getTime() + dias * 86_400_000);
