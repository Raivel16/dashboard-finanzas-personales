import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENSAJES, esquemaRegistro } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { registrar } from '../services/autenticacion.service.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';

const VALORES_INICIALES = { nombre: '', email: '', password: '' };

export function useRegistro() {
  const navegar = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: esquemaRegistro,
    valoresIniciales: VALORES_INICIALES,
    alEnviar: async (datos) => {
      setErrorGeneral('');
      try {
        await registrar(datos);
      } catch (error) {
        const porCampo = erroresPorCampo(error);
        if (porCampo) formulario.fijarErrores(porCampo);
        else setErrorGeneral(error.message);
        return;
      }
      navegar('/iniciar-sesion', { replace: true, state: { mensaje: MENSAJES.auth.registroExitoso } });
    },
  });

  return { formulario, errorGeneral };
}
