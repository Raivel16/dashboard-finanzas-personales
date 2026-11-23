import { useCallback, useEffect, useState } from 'react';
import { MENSAJES } from '@finanzas/shared';
import { confirmar, notificar } from '../../shared/utils/notificaciones.js';
import { eliminarCategoria, listarCategorias } from '../services/categorias.service.js';

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });

/** Gastos e ingresos por separado, cada grupo ordenado por nombre. */
export const agruparCategorias = (categorias) => ({
  gastos: categorias.filter((c) => c.tipo === 'gasto').sort(porNombre),
  ingresos: categorias.filter((c) => c.tipo === 'ingreso').sort(porNombre),
});

/**
 * Sección "Categorías": carga, panel de crear o editar y eliminación con confirmación.
 * `estado`: cargando | listo | error. `panel`: null, { modo: 'crear' } o { modo: 'editar', categoria }.
 */
export function useCategorias() {
  const [intento, setIntento] = useState(0);
  // Resultado de la última carga terminada; "cargando" se deduce de que no corresponda al intento actual.
  const [resultado, setResultado] = useState(null);
  const [panel, setPanel] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    listarCategorias({ signal: control.signal })
      .then((categorias) => setResultado({ intento, categorias }))
      .catch((error) => {
        if (error?.name !== 'AbortError') setResultado({ intento, error: error.message });
      });
    return () => control.abort();
  }, [intento]);

  const vigente = resultado?.intento === intento ? resultado : null;
  let estado = 'cargando';
  if (vigente) estado = vigente.error ? 'error' : 'listo';

  const cambiarLista = useCallback((cambio) => {
    setResultado((anterior) =>
      anterior?.categorias ? { ...anterior, categorias: cambio(anterior.categorias) } : anterior,
    );
  }, []);

  /** Se llama tras crear o editar con la categoría que devolvió el servidor. */
  const guardada = useCallback(
    (categoria, editada) => {
      cambiarLista((lista) =>
        editada ? lista.map((c) => (c.id === categoria.id ? categoria : c)) : [...lista, categoria],
      );
      setPanel(null);
      notificar.exito(editada ? MENSAJES.categoria.actualizada : MENSAJES.categoria.creada);
    },
    [cambiarLista],
  );

  const cerrarPanel = useCallback(() => setPanel(null), []);

  const eliminar = async (categoria) => {
    const acepto = await confirmar({
      titulo: 'Eliminar categoría',
      texto: `Se eliminará la categoría "${categoria.nombre}". Esta acción no se puede deshacer.`,
      confirmar: 'Eliminar',
      peligro: true,
    });
    if (!acepto) return; // sin confirmar no se llama a la API
    setEliminando(categoria.id);
    try {
      await eliminarCategoria(categoria.id);
      cambiarLista((lista) => lista.filter((c) => c.id !== categoria.id));
      notificar.exito(MENSAJES.categoria.eliminada);
    } catch (error) {
      // Con movimientos asociados el servidor responde 409 con el mensaje de la spec y la categoría se conserva.
      notificar.error(error.message);
    } finally {
      setEliminando(null);
    }
  };

  return {
    estado,
    mensaje: vigente?.error ?? '',
    ...agruparCategorias(vigente?.categorias ?? []),
    panel,
    eliminando,
    abrirCrear: () => setPanel({ modo: 'crear' }),
    abrirEditar: (categoria) => setPanel({ modo: 'editar', categoria }),
    cerrarPanel,
    guardada,
    eliminar,
    reintentar: () => setIntento((n) => n + 1),
  };
}
