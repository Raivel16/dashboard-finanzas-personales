import { useState } from 'react';
import { ROLES } from '@finanzas/shared';
import { useSesion } from '../../autenticacion/index.js';
import { confirmar, notificar } from '../../shared/utils/notificaciones.js';
import { cambiarRol } from '../services/administracion.service.js';
import { ETIQUETAS_ROL } from '../etiquetas.js';

/** Cambio de rol con confirmación previa. `alCambiar` recibe el usuario ya actualizado. */
export function useCambioRol({ alCambiar }) {
  const { usuario: yo, refrescarSesion } = useSesion();
  const [enCurso, setEnCurso] = useState(null);

  const cambiar = async (objetivo, rol) => {
    if (rol === objetivo.rol) return;
    const acepto = await confirmar({
      titulo: 'Cambiar rol',
      texto: `${objetivo.nombre} (${objetivo.email}) pasará a ser ${ETIQUETAS_ROL[rol].toLowerCase()}.`,
      confirmar: 'Cambiar rol',
      peligro: rol !== ROLES.ADMIN,
    });
    if (!acepto) return; // sin confirmar no se llama a la API y el selector conserva su valor

    setEnCurso(objetivo.id);
    try {
      const actualizado = await cambiarRol(objetivo.id, rol);
      alCambiar(actualizado);
      notificar.exito(`${actualizado.nombre} ahora es ${ETIQUETAS_ROL[actualizado.rol].toLowerCase()}`);
      // Si la persona cambió su propio rol, el menú debe reflejarlo.
      if (objetivo.id === yo.id) await refrescarSesion();
    } catch (error) {
      notificar.error(error.message);
      if (error.estado === 403) await refrescarSesion();
    } finally {
      setEnCurso(null);
    }
  };

  return { cambiar, enCurso };
}
