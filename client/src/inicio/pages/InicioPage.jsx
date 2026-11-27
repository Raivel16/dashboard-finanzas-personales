import { DashboardPage } from '../../dashboard/index.js';

export function InicioPage() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-[650] leading-tight">Finanzas personales</h1>
      <DashboardPage />
    </section>
  );
}
