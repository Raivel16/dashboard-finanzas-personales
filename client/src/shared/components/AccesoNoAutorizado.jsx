import { Link } from 'react-router-dom';
import { useT } from '../preferencias/traducir.js';

/** Pantalla de 403: la persona está autenticada pero su rol no le permite ver esta sección. */
export function AccesoNoAutorizado() {
  const t = useT();
  return (
    <section className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-[650] leading-tight">{t('Acceso no autorizado')}</h1>
      <p className="max-w-[70ch] text-tinta-suave">{t('Tu rol actual no permite abrir esta sección.')}</p>
      <Link
        to="/"
        className="inline-flex min-h-11 items-center rounded-control border border-sello bg-sello px-4 font-semibold text-hoja hover:bg-sello-oscuro"
      >
        {t('Volver al inicio')}
      </Link>
    </section>
  );
}
