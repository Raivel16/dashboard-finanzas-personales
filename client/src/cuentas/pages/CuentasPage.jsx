import { PanelRegistro } from '../../shared/components/PanelRegistro.jsx';
import { ListaCuentas } from '../components/ListaCuentas.jsx';
import { useCuentas } from '../hooks/useCuentas.js';
import { FormularioCuentaPanel } from './FormularioCuentaPanel.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

export function CuentasPage() {
  const t = useT();
  const cuentas = useCuentas();
  const { panel, cerrarPanel } = cuentas;
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-[650] leading-tight">{t('Cuentas')}</h1>
        <p className="mt-1 text-tinta-suave">{t('Dónde guardas tu dinero y cuánto hay en cada lugar.')}</p>
      </div>
      <ListaCuentas
        {...cuentas}
        alCrear={cuentas.abrirCrear}
        alEditar={cuentas.abrirEditar}
        alEliminar={cuentas.eliminar}
      />
      <PanelRegistro
        abierto={Boolean(panel)}
        titulo={panel?.modo === 'editar' ? t('Editar cuenta') : t('Nueva cuenta')}
        alCerrar={cerrarPanel}
      >
        {panel && (
          <FormularioCuentaPanel
            key={panel.cuenta?.id ?? 'nueva'}
            panel={panel}
            alGuardar={cuentas.guardada}
            alCancelar={cerrarPanel}
          />
        )}
      </PanelRegistro>
    </section>
  );
}
