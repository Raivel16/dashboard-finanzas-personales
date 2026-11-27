import { PanelRegistro } from '../../shared/components/PanelRegistro.jsx';
import { ListaCategorias } from '../components/ListaCategorias.jsx';
import { useCategorias } from '../hooks/useCategorias.js';
import { FormularioCategoriaPanel } from './FormularioCategoriaPanel.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

export function CategoriasPage() {
  const t = useT();
  const categorias = useCategorias();
  const { panel, cerrarPanel } = categorias;
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-[650] leading-tight">{t('Categorías')}</h1>
        <p className="mt-1 text-tinta-suave">{t('Clasifica tus ingresos y gastos a tu manera.')}</p>
      </div>
      <ListaCategorias
        {...categorias}
        alCrear={categorias.abrirCrear}
        alEditar={categorias.abrirEditar}
        alEliminar={categorias.eliminar}
      />
      <PanelRegistro
        abierto={Boolean(panel)}
        titulo={panel?.modo === 'editar' ? t('Editar categoría') : t('Nueva categoría')}
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
