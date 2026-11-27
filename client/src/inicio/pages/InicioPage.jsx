import { DashboardPage } from '../../dashboard/index.js';
import { useT } from '../../shared/preferencias/traducir.js';

export function InicioPage() {
  const t = useT();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-[650] leading-tight">{t('Finanzas personales')}</h1>
      <DashboardPage />
    </section>
  );
}
