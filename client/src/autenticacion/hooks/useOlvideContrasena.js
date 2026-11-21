import { useState } from 'react';
import { esquemaOlvideContrasena } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { solicitarRecuperacion } from '../services/autenticacion.service.js';
import { erroresPorCampo } from './erroresApi.js';

export function useOlvideContrasena() {
  const [confirmacion, setConfirmacion] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: esquemaOlvideContrasena,
    valoresIniciales: { email: '' },
    alEnviar: async (datos) => {
      setErrorGeneral('');
      try {
        const respuesta = await solicitarRecuperacion(datos);
        setConfirmacion(respuesta.mensaje);
      } catch (error) {
        const porCampo = erroresPorCampo(error);
        if (porCampo) formulario.fijarErrores(porCampo);
        else setErrorGeneral(error.message);
      }
    },
  });

  return { formulario, confirmacion, errorGeneral };
}
