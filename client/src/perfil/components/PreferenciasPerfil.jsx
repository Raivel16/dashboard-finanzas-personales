import { SelectorIdioma } from '../../shared/components/SelectorIdioma.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

function Interruptor({ id, etiqueta, ayuda, activo, deshabilitado, alCambiar }) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={activo}
        disabled={deshabilitado}
        onChange={(evento) => alCambiar(evento.target.checked)}
        aria-describedby={`${id}-ayuda`}
        className="mt-1 size-5 shrink-0 accent-sello"
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="text-base font-medium text-tinta">
          {etiqueta}
        </label>
        <p id={`${id}-ayuda`} className="text-sm text-tinta-suave">
          {ayuda}
        </p>
      </div>
    </div>
  );
}

/** Preferencias de idioma y accesibilidad del perfil (HU-32, HU-33). Presentación pura. */
export function PreferenciasPerfil({ idioma, textoGrande, altoContraste, guardando, alCambiar }) {
  const t = useT();
  return (
    <section aria-labelledby="titulo-preferencias" className="flex max-w-md flex-col gap-4">
      <h2 id="titulo-preferencias" className="text-lg font-semibold">
        {t('Idioma y accesibilidad')}
      </h2>
      <SelectorIdioma
        id="preferencia-idioma"
        idioma={idioma}
        alCambiar={(valor) => alCambiar({ idioma: valor })}
      />
      <Interruptor
        id="preferencia-texto-grande"
        etiqueta={t('Texto grande')}
        ayuda={t('Aumenta el tamaño de todo el texto de la aplicación.')}
        activo={textoGrande}
        deshabilitado={guardando}
        alCambiar={(valor) => alCambiar({ textoGrande: valor })}
      />
      <Interruptor
        id="preferencia-alto-contraste"
        etiqueta={t('Alto contraste')}
        ayuda={t('Usa colores con mayor contraste en todas las pantallas.')}
        activo={altoContraste}
        deshabilitado={guardando}
        alCambiar={(valor) => alCambiar({ altoContraste: valor })}
      />
    </section>
  );
}
