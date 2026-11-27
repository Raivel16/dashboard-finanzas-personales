import { PanelRegistro } from '../../shared/components/PanelRegistro.jsx';
import { ListaPresupuestos } from '../components/ListaPresupuestos.jsx';
import { usePresupuestos } from '../hooks/usePresupuestos.js';
import { FormularioPresupuestoPanel } from './FormularioPresupuestoPanel.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

export function PresupuestosPage() {
  const t = useT();
  const presupuestos = usePresupuestos();
  const { panel, cerrarPanel } = presupuestos;
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-[650] leading-tight">{t('Presupuestos')}</h1>
        <p className="mt-1 text-tinta-suave">{t('Cuánto planeas gastar cada mes y cuánto llevas.')}</p>
      </div>
      <ListaPresupuestos
        {...presupuestos}
        alCrear={presupuestos.abrirCrear}
        alEditar={presupuestos.abrirEditar}
        alEliminar={presupuestos.eliminar}
      />
      <PanelRegistro
        abierto={Boolean(panel)}
        titulo={panel?.modo === 'editar' ? t('Editar presupuesto') : t('Nuevo presupuesto')}
        alCerrar={cerrarPanel}
      >
        {panel && (
          <FormularioPresupuestoPanel
            key={panel.presupuesto?.id ?? 'nuevo'}
            panel={panel}
            periodo={presupuestos.periodo}
            items={presupuestos.items}
            categorias={presupuestos.categorias}
            alGuardar={presupuestos.guardado}
            alCancelar={cerrarPanel}
          />
        )}
      </PanelRegistro>
    </section>
  );
}
