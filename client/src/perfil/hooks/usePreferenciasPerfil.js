import { useState } from 'react';
import { useSesion } from '../../autenticacion/index.js';
import { usePreferencias } from '../../shared/preferencias/traducir.js';
import { notificar } from '../../shared/utils/notificaciones.js';
import { actualizarPreferencias } from '../services/perfil.service.js';

/**
 * Idioma, texto grande y alto contraste (HU-32, HU-33). El cambio se aplica de inmediato en la pantalla y se guarda
 * en el perfil para que se conserve al volver a iniciar sesión; si no se puede guardar, se deshace.
 */
export function usePreferenciasPerfil() {
  const { reemplazarUsuario } = useSesion();
  const { idioma, textoGrande, altoContraste, cambiarPreferencias } = usePreferencias();
  const [guardando, setGuardando] = useState(false);

  const cambiar = async (cambios) => {
    const anteriores = { idioma, textoGrande, altoContraste };
    cambiarPreferencias(cambios);
    setGuardando(true);
    try {
      reemplazarUsuario(await actualizarPreferencias(cambios));
      notificar.exito('Tus preferencias se guardaron');
    } catch {
      cambiarPreferencias(anteriores);
      notificar.error('No se pudieron guardar tus preferencias. Intenta nuevamente');
    } finally {
      setGuardando(false);
    }
  };

  return { idioma, textoGrande, altoContraste, guardando, alCambiar: cambiar };
}
