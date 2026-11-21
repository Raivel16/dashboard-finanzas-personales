import { useCallback, useEffect, useMemo, useState } from 'react';
import { MENSAJES, ROLES } from '@finanzas/shared';
import { configurarSesionHttp } from '../../shared/api/clienteHttp.js';
import * as servicio from '../services/autenticacion.service.js';

/** Mensaje para la pantalla de inicio de sesión según por qué terminó la sesión. */
const avisoDe = (codigo) =>
  ({
    SESSION_EXPIRED: MENSAJES.generales.sesionExpirada,
    SESSION_REVOKED: MENSAJES.generales.sesionCerrada,
  })[codigo] ?? null;

/**
 * Estado de la sesión de la aplicación. La sesión vive solo en memoria: las credenciales están en
 * cookies httpOnly que el JavaScript no puede leer, así que al abrir la app se pregunta a /auth/me.
 */
export function useEstadoSesion() {
  const [estado, setEstado] = useState('cargando');
  const [usuario, setUsuario] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let activo = true;
    configurarSesionHttp({
      renovar: async () => {
        const renovado = await servicio.renovarSesion();
        if (activo) setUsuario(renovado);
      },
      alSesionTerminada: (error) => {
        if (!activo) return;
        setUsuario(null);
        setEstado('anonimo');
        setAviso(avisoDe(error.codigo));
      },
    });
    servicio
      .obtenerSesion()
      .then((actual) => {
        if (!activo) return;
        setUsuario(actual);
        setEstado('autenticado');
      })
      .catch(() => activo && setEstado('anonimo'));
    return () => {
      activo = false;
      configurarSesionHttp();
    };
  }, []);

  const iniciarSesion = useCallback(async (credenciales) => {
    const actual = await servicio.iniciarSesion(credenciales);
    setUsuario(actual);
    setAviso(null);
    setEstado('autenticado');
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await servicio.cerrarSesion();
    } catch {
      // Aunque el servidor no responda, esta pantalla deja de mostrar datos de la persona.
    }
    setUsuario(null);
    setAviso(null);
    setEstado('anonimo');
  }, []);

  const limpiarAviso = useCallback(() => setAviso(null), []);

  /** Sustituye los datos de la persona (p. ej. tras guardar su perfil) sin volver a iniciar sesión. */
  const reemplazarUsuario = useCallback((actual) => setUsuario(actual), []);

  return useMemo(
    () => ({
      estado,
      usuario,
      aviso,
      esAdmin: usuario?.rol === ROLES.ADMIN,
      iniciarSesion,
      cerrarSesion,
      limpiarAviso,
      reemplazarUsuario,
    }),
    [estado, usuario, aviso, iniciarSesion, cerrarSesion, limpiarAviso, reemplazarUsuario],
  );
}
