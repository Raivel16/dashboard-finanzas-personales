import { FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react';
import { MENSAJES } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';

const FORMATOS = [
  { formato: 'pdf', texto: 'Exportar a PDF', icono: FileText },
  { formato: 'xlsx', texto: 'Exportar a Excel', icono: FileSpreadsheet },
];

/** Botones para llevarse el historial filtrado. Presentacional: todo llega por props. */
export function BarraExportacion({ hayDatos, generando, lenta, error, deshabilitado, alExportar }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {FORMATOS.map(({ formato, texto, icono: Icono }) => (
          <Boton
            key={formato}
            disabled={deshabilitado}
            aria-busy={generando === formato}
            onClick={() => alExportar(formato)}
          >
            {generando === formato ? (
              <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
            ) : (
              <Icono aria-hidden="true" size={18} />
            )}
            {generando === formato ? 'Generando…' : texto}
          </Boton>
        ))}
        {!hayDatos && <p className="text-sm text-tinta-suave">{MENSAJES.reporte.sinDatos}</p>}
      </div>
      {lenta && <Aviso tipo="info">{MENSAJES.reporte.enSegundoPlano}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}
    </div>
  );
}
