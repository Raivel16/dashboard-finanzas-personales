import { PanelRegistro } from '../../shared/components/PanelRegistro.jsx';
import { DetalleMovimiento } from '../components/DetalleMovimiento.jsx';
import { ListaMovimientos } from '../components/ListaMovimientos.jsx';
import { useFiltrosMovimientos } from '../hooks/useFiltrosMovimientos.js';
import { useMovimientos } from '../hooks/useMovimientos.js';
import { FormularioMovimientoPanel } from './FormularioMovimientoPanel.jsx';

const TITULOS = { crear: 'Nuevo movimiento', editar: 'Editar movimiento', detalle: 'Detalle del movimiento' };
const nombreDe = (lista, id) => lista.find((elemento) => elemento.id === id)?.nombre;

export function MovimientosPage() {
  const movimientos = useMovimientos();
  const { panel, cerrarPanel, cuentas, categorias } = movimientos;
  const formFiltros = useFiltrosMovimientos({
    filtros: movimientos.filtros,
    alAplicar: movimientos.aplicarFiltros,
    alLimpiar: movimientos.limpiarFiltros,
  });

  const detalle = panel?.modo === 'detalle' ? panel.movimiento : null;
  const eliminarDesdeDetalle = () => {
    cerrarPanel();
    void movimientos.eliminar(detalle);
  };

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-[650] leading-tight">Movimientos</h1>
        <p className="mt-1 text-tinta-suave">Tus ingresos y gastos, con el saldo que dejó cada uno.</p>
      </div>
      <section aria-labelledby="historial-movimientos" className="flex flex-col gap-3">
        <h2 id="historial-movimientos" className="text-lg font-semibold">
          Historial de movimientos
        </h2>
        <ListaMovimientos
          {...movimientos}
          formFiltros={formFiltros}
          alCrear={movimientos.abrirCrear}
          alEditar={movimientos.abrirEditar}
          alEliminar={movimientos.eliminar}
          alVerDetalle={movimientos.abrirDetalle}
        />
      </section>
      <PanelRegistro abierto={Boolean(panel)} titulo={panel ? TITULOS[panel.modo] : ''} alCerrar={cerrarPanel}>
        {detalle && (
          <DetalleMovimiento
            movimiento={detalle}
            categoria={nombreDe(categorias, detalle.categoriaId)}
            cuenta={nombreDe(cuentas, detalle.cuentaId)}
            alEditar={() => movimientos.abrirEditar(detalle)}
            alEliminar={eliminarDesdeDetalle}
            alCerrar={cerrarPanel}
          />
        )}
        {panel && !detalle && (
          <FormularioMovimientoPanel
            key={panel.movimiento?.id ?? 'nuevo'}
            panel={panel}
            cuentas={cuentas}
            categorias={categorias}
            alGuardar={movimientos.guardado}
            alCancelar={cerrarPanel}
          />
        )}
      </PanelRegistro>
    </section>
  );
}
