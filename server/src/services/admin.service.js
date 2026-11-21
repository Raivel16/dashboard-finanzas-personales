// Administración de usuarios (HU-22, HU-23). Todo método exige primero el rol de administrador.
import { MENSAJES } from '@finanzas/shared';
import { ConflictError, NotFoundError } from '../utils/errores.js';
import { RepositorioLectura } from '../repositories/base.repository.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';

export function crearAdminService({ autorizacion, logger }) {
  const exigir = (actor, accion) => autorizacion.exigirAdmin(actor, { accion });

  return {
    async listarUsuarios(actor, consulta) {
      exigir(actor, 'listar usuarios');
      return usuarioRepository.listarParaAdmin(consulta);
    },

    async obtenerUsuario(actor, id) {
      exigir(actor, 'consultar usuario');
      const usuario = await usuarioRepository.buscarPorId(id);
      if (!usuario) throw new NotFoundError();
      return usuario;
    },

    /** Cambia el rol sin permitir que el sistema se quede sin administradores. */
    async cambiarRol(actor, id, rol) {
      exigir(actor, 'cambiar rol');
      const resultado = await usuarioRepository.cambiarRolGarantizandoAdministrador(id, rol);
      if (resultado.estado === 'no_existe') throw new NotFoundError();
      if (resultado.estado === 'ultimo_administrador') {
        throw new ConflictError(MENSAJES.admin.ultimoAdministrador);
      }
      if (resultado.estado === 'ok') {
        logger.info({ actorId: actor.id, usuarioId: id, rol }, 'rol de usuario cambiado');
      }
      return resultado.usuario;
    },

    /**
     * Repositorio de solo lectura sobre los datos de otra persona, para las rutas GET de administración
     * de cada recurso (categorías, cuentas, movimientos, presupuestos).
     */
    async repositorioLecturaDe(actor, modelo, usuarioId) {
      exigir(actor, 'leer datos de un usuario');
      const usuario = await usuarioRepository.buscarPorId(usuarioId);
      if (!usuario) throw new NotFoundError();
      return new RepositorioLectura(modelo, usuario.tenantId);
    },
  };
}
