import { useState } from 'react';
import { MENSAJES, esquemaActualizarPerfil } from '@finanzas/shared';
import { useSesion } from '../../autenticacion/index.js';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { notificar } from '../../shared/utils/notificaciones.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';
import { actualizarPerfil } from '../services/perfil.service.js';

/** Edición del nombre y la moneda principal. El correo se muestra pero nunca se envía. */
export function usePerfil() {
  const { usuario, reemplazarUsuario } = useSesion();
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: esquemaActualizarPerfil,
    valoresIniciales: { nombre: usuario.nombre, monedaPrincipal: usuario.monedaPrincipal },
    alEnviar: async (datos) => {
      setErrorGeneral('');
      try {
        reemplazarUsuario(await actualizarPerfil(datos));
        notificar.exito(MENSAJES.perfil.actualizado);
      } catch (error) {
        const porCampo = erroresPorCampo(error);
        if (porCampo) formulario.fijarErrores(porCampo);
        else setErrorGeneral(error.message);
      }
    },
  });

  return { formulario, errorGeneral, correo: usuario.email, nota: MENSAJES.perfil.correoSoloLectura };
}
