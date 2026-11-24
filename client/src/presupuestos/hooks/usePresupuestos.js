import { useCallback, useEffect, useState } from 'react';
import { MENSAJES, fechaHoy } from '@finanzas/shared';
import { listarCategorias } from '../../categorias/index.js';
import { confirmar, notificar } from '../../shared/utils/notificaciones.js';
import { eliminarPresupuesto, obtenerSeguimiento } from '../services/presupuestos.service.js';

/** Mes en curso como "AAAA-MM". */
export const mesActual = () => fechaHoy().slice(0, 7);

/**
 * Sección "Presupuestos": el seguimiento del mes elegido, las categorías para el formulario, el panel de definir o
 * cambiar un presupuesto y la eliminación con confirmación.
 * `estado`: cargando | listo | error. `panel`: null o { modo: 'crear' | 'editar', presupuesto }.
 */
export function usePresupuestos() {
  const [periodo, setPeriodo] = useState(mesActual);
  const [intento, setIntento] = useState(0);
  // Última carga terminada: mientras llega la siguiente (otro mes, o tras guardar) se sigue mostrando la anterior.
  const [resultado, setResultado] = useState(null);
  const [panel, setPanel] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    Promise.all([obtenerSeguimiento({ periodo, signal: control.signal }), listarCategorias({ signal: control.signal })])
      .then(([seguimiento, categorias]) => setResultado({ items: seguimiento.data, categorias }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setResultado({ error: MENSAJES.presupuesto.errorCarga });
      });
    return () => control.abort();
  }, [periodo, intento]);

  let estado = 'cargando';
  if (resultado) estado = resultado.error ? 'error' : 'listo';

  const recargar = useCallback(() => setIntento((n) => n + 1), []);
  const cerrarPanel = useCallback(() => setPanel(null), []);

  /** Tras guardar se muestra el mes del presupuesto (puede ser otro) y se vuelve a pedir el seguimiento. */
  const guardado = useCallback(
    ({ presupuesto, reemplazado }) => {
      setPanel(null);
      notificar.exito(reemplazado ? MENSAJES.presupuesto.reemplazado : MENSAJES.presupuesto.creado);
      setPeriodo(presupuesto.periodo);
      recargar();
    },
    [recargar],
  );

  const eliminar = async (item) => {
    const acepto = await confirmar({
      titulo: 'Eliminar presupuesto',
      texto: 'Se eliminará este presupuesto. Esta acción no se puede deshacer.',
      confirmar: 'Eliminar',
      peligro: true,
    });
    if (!acepto) return; // sin confirmar no se llama a la API
    setEliminando(item.id);
    try {
      await eliminarPresupuesto(item.id);
      notificar.exito(MENSAJES.presupuesto.eliminado);
      recargar();
    } catch (error) {
      // Un general con presupuestos por categoría responde 409 con su mensaje y se conserva.
      notificar.error(error.message);
    } finally {
      setEliminando(null);
    }
  };

  return {
    estado,
    mensaje: resultado?.error ?? '',
    items: resultado?.items ?? [],
    categorias: resultado?.categorias ?? [],
    periodo,
    esMesPasado: periodo < mesActual(),
    cambiarPeriodo: (nuevo) => nuevo && setPeriodo(nuevo),
    panel,
    eliminando,
    abrirCrear: () => setPanel({ modo: 'crear' }),
    abrirEditar: (presupuesto) => setPanel({ modo: 'editar', presupuesto }),
    cerrarPanel,
    guardado,
    eliminar,
    reintentar: recargar,
  };
}
