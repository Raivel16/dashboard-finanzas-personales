import { PanelRegistro } from '../../shared/components/PanelRegistro.jsx';
import { ListaMovimientos } from '../components/ListaMovimientos.jsx';
import { useMovimientos } from '../hooks/useMovimientos.js';
import { FormularioMovimientoPanel } from './FormularioMovimientoPanel.jsx';

export function MovimientosPage() {
  const movimientos = useMovimientos();
  const { panel, cerrarPanel, cuentas, categorias } = movimientos;
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-[650] leading-tight">Movimientos</h1>
        <p className="mt-1 text-tinta-suave">Tus ingresos y gastos, con el saldo que dejó cada uno.</p>
      </div>
      <ListaMovimientos
        {...movimientos}
        alCrear={movimientos.abrirCrear}
        alEditar={movimientos.abrirEditar}
        alEliminar={movimientos.eliminar}
      />
      <PanelRegistro
        abierto={Boolean(panel)}
        titulo={panel?.modo === 'editar' ? 'Editar movimiento' : 'Nuevo movimiento'}
        alCerrar={cerrarPanel}
      >
        {panel && (
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
