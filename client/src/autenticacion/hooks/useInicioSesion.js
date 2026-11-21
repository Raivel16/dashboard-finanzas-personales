import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CODIGOS_ERROR, MENSAJES, esquemaInicioSesion } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { useSesion } from './contextoSesion.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';

const VALORES_INICIALES = { email: '', password: '' };

/** Solo se vuelve a rutas internas de la aplicación. */
const rutaSegura = (ruta) => (typeof ruta === 'string' && /^\/(?!\/)/.test(ruta) ? ruta : '/');

export function useInicioSesion({ ahora = Date.now } = {}) {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { iniciarSesion, aviso } = useSesion();
  const [errorGeneral, setErrorGeneral] = useState('');
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
  const [reloj, setReloj] = useState(ahora());

  // Mientras dura el bloqueo se cuenta hacia atrás y, al vencer, se habilita el botón.
  useEffect(() => {
    if (!bloqueadoHasta) return undefined;
    const intervalo = setInterval(() => {
      const actual = ahora();
      setReloj(actual);
      if (actual >= bloqueadoHasta) setBloqueadoHasta(null);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [bloqueadoHasta, ahora]);

  const formulario = useFormulario({
    esquema: esquemaInicioSesion,
    valoresIniciales: VALORES_INICIALES,
    alEnviar: async (datos) => {
      setErrorGeneral('');
      try {
        await iniciarSesion(datos);
      } catch (error) {
        const hasta = Date.parse(error.detalles?.bloqueadoHasta);
        if (error.codigo === CODIGOS_ERROR.TOO_MANY_REQUESTS && !Number.isNaN(hasta)) {
          setReloj(ahora());
          setBloqueadoHasta(hasta);
          return;
        }
        const porCampo = erroresPorCampo(error);
        if (porCampo) formulario.fijarErrores(porCampo);
        else setErrorGeneral(error.message);
        return;
      }
      navegar(rutaSegura(ubicacion.state?.desde), { replace: true });
    },
  });

  const minutosRestantes = bloqueadoHasta ? Math.max(1, Math.ceil((bloqueadoHasta - reloj) / 60_000)) : 0;

  return {
    formulario,
    errorGeneral,
    bloqueado: Boolean(bloqueadoHasta),
    mensajeBloqueo: bloqueadoHasta ? MENSAJES.auth.bloqueado(minutosRestantes) : '',
    // Mensajes que explican cómo se llegó a esta pantalla: sesión terminada, cuenta creada, contraseña nueva.
    aviso: aviso ?? ubicacion.state?.mensaje ?? '',
  };
}
