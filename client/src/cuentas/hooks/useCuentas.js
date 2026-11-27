import { useCallback, useEffect, useState } from 'react';
import { MENSAJES } from '@finanzas/shared';
import { confirmar, notificar } from '../../shared/utils/notificaciones.js';
import { traducir } from '../../shared/preferencias/traducir.js';
import { eliminarCuenta, listarCuentas } from '../services/cuentas.service.js';

/**
 * Sección "Cuentas": carga, panel de crear o editar y eliminación con confirmación.
 * `estado`: cargando | listo | error. `panel`: null, { modo: 'crear' } o { modo: 'editar', cuenta }.
 */
export function useCuentas() {
  const [intento, setIntento] = useState(0);
  // Resultado de la última carga terminada; "cargando" se deduce de que no corresponda al intento actual.
  const [resultado, setResultado] = useState(null);
  const [panel, setPanel] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    listarCuentas({ signal: control.signal })
      .then((cuentas) => setResultado({ intento, cuentas }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setResultado({ intento, error: error.message });
      });
    return () => control.abort();
  }, [intento]);

  const vigente = resultado?.intento === intento ? resultado : null;
  let estado = 'cargando';
  if (vigente) estado = vigente.error ? 'error' : 'listo';

  const cambiarLista = useCallback((cambio) => {
    setResultado((anterior) => (anterior?.cuentas ? { ...anterior, cuentas: cambio(anterior.cuentas) } : anterior));
  }, []);

  /** Se llama tras crear o editar con la cuenta que devolvió el servidor (ya con su saldo actual). */
  const guardada = useCallback(
    (cuenta, editada) => {
      cambiarLista((lista) => (editada ? lista.map((c) => (c.id === cuenta.id ? cuenta : c)) : [...lista, cuenta]));
      setPanel(null);
      notificar.exito(editada ? MENSAJES.cuenta.actualizada : MENSAJES.cuenta.creada);
    },
    [cambiarLista],
  );

  const cerrarPanel = useCallback(() => setPanel(null), []);

  const eliminar = async (cuenta) => {
    const acepto = await confirmar({
      titulo: 'Eliminar cuenta',
      texto: traducir('Se eliminará la cuenta "{nombre}". Esta acción no se puede deshacer.', cuenta),
      confirmar: 'Eliminar',
      peligro: true,
    });
    if (!acepto) return; // sin confirmar no se llama a la API
    setEliminando(cuenta.id);
    try {
      await eliminarCuenta(cuenta.id);
      cambiarLista((lista) => lista.filter((c) => c.id !== cuenta.id));
      notificar.exito(MENSAJES.cuenta.eliminada);
    } catch (error) {
      // Con movimientos asociados el servidor responde 409 con el mensaje de la spec y la cuenta se conserva.
      notificar.error(error.message);
    } finally {
      setEliminando(null);
    }
  };

  return {
    estado,
    mensaje: vigente?.error ?? '',
    cuentas: vigente?.cuentas ?? [],
    panel,
    eliminando,
    abrirCrear: () => setPanel({ modo: 'crear' }),
    abrirEditar: (cuenta) => setPanel({ modo: 'editar', cuenta }),
    cerrarPanel,
    guardada,
    eliminar,
    reintentar: () => setIntento((n) => n + 1),
  };
}
