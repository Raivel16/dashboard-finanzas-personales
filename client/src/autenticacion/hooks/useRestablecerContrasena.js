import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CODIGOS_ERROR, MENSAJES, esquemaRestablecerContrasena } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { restablecerContrasena } from '../services/autenticacion.service.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';

export function useRestablecerContrasena() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  // El token se lee una vez de la URL y se quita de la barra: no queda en el historial ni en capturas.
  const [token] = useState(() => parametros.get('token') ?? '');
  const [enlaceExpirado, setEnlaceExpirado] = useState(!token);
  const [errorGeneral, setErrorGeneral] = useState('');

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
  }, []);

  const formulario = useFormulario({
    esquema: { password: esquemaRestablecerContrasena.password },
    valoresIniciales: { password: '' },
    alEnviar: async ({ password }) => {
      setErrorGeneral('');
      try {
        await restablecerContrasena({ token, password });
      } catch (error) {
        const porCampo = erroresPorCampo(error);
        if (error.codigo === CODIGOS_ERROR.TOKEN_INVALID) setEnlaceExpirado(true);
        else if (porCampo?.password) formulario.fijarErrores({ password: porCampo.password });
        else setErrorGeneral(error.message);
        return;
      }
      navegar('/iniciar-sesion', {
        replace: true,
        state: { mensaje: MENSAJES.auth.contrasenaRestablecida },
      });
    },
  });

  return { formulario, enlaceExpirado, errorGeneral };
}
