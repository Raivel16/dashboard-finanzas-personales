import { useState } from 'react';
import { MENSAJES, esquemaCambiarContrasena } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { notificar } from '../../shared/utils/notificaciones.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';
import { cambiarContrasena } from '../services/perfil.service.js';

// La confirmación solo existe en la pantalla: no viaja al servidor.
const ESQUEMA = {
  ...esquemaCambiarContrasena,
  confirmacion: {
    requerido: true,
    etiqueta: 'La confirmación',
    reglas: [
      { ok: (texto, datos) => texto === datos.passwordNueva, mensaje: MENSAJES.usuario.contrasenaDistinta },
    ],
  },
};

const VALORES_INICIALES = { passwordActual: '', passwordNueva: '', confirmacion: '' };

export function useCambiarContrasena() {
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: ESQUEMA,
    valoresIniciales: VALORES_INICIALES,
    alEnviar: async ({ passwordActual, passwordNueva }) => {
      setErrorGeneral('');
      try {
        await cambiarContrasena({ passwordActual, passwordNueva });
      } catch (error) {
        const porCampo = erroresPorCampo(error);
        if (porCampo) formulario.fijarErrores(porCampo);
        else setErrorGeneral(error.message);
        return;
      }
      formulario.reiniciar();
      notificar.exito(MENSAJES.auth.contrasenaCambiada);
    },
  });

  return { formulario, errorGeneral };
}
