// Autorización por rol en la capa de servicios (defensa en profundidad): no depende de que las rutas
// estén bien montadas ni de que la interfaz oculte una opción. Cada denegación queda en el log.
import { ROLES } from '@finanzas/shared';
import { ForbiddenError } from '../utils/errores.js';

export function crearAutorizacion({ logger }) {
  const denegar = (actor, contexto, motivo) => {
    logger.warn(
      { usuarioId: actor?.id ?? null, rol: actor?.rol ?? null, ...contexto, motivo },
      'acceso no autorizado',
    );
    throw new ForbiddenError();
  };

  return {
    /** @param {{ id: string, rol: string } | undefined} actor  la persona autenticada */
    exigirRol(actor, roles, contexto = {}) {
      if (!actor || !roles.includes(actor.rol)) {
        denegar(actor, contexto, `se requiere el rol ${roles.join(' o ')}`);
      }
    },
    exigirAdmin(actor, contexto = {}) {
      this.exigirRol(actor, [ROLES.ADMIN], contexto);
    },
  };
}
