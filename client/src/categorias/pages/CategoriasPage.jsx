import { PanelRegistro } from '../../shared/components/PanelRegistro.jsx';
import { ListaCategorias } from '../components/ListaCategorias.jsx';
import { useCategorias } from '../hooks/useCategorias.js';
import { FormularioCategoriaPanel } from './FormularioCategoriaPanel.jsx';

export function CategoriasPage() {
  const categorias = useCategorias();
  const { panel, cerrarPanel } = categorias;
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-[650] leading-tight">Categorías</h1>
        <p className="mt-1 text-tinta-suave">Clasifica tus ingresos y gastos a tu manera.</p>
      </div>
      <ListaCategorias
        {...categorias}
        alCrear={categorias.abrirCrear}
        alEditar={categorias.abrirEditar}
        alEliminar={categorias.eliminar}
      />
      <PanelRegistro
        abierto={Boolean(panel)}
        titulo={panel?.modo === 'editar' ? 'Editar categoría' : 'Nueva categoría'}
        alCerrar={cerrarPanel}
      >
        {panel && (
          <FormularioCategoriaPanel
            key={panel.categoria?.id ?? 'nueva'}
            panel={panel}
            alGuardar={categorias.guardada}
            alCancelar={cerrarPanel}
          />
        )}
      </PanelRegistro>
    </section>
  );
}
