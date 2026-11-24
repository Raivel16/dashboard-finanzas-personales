# Tasks

> Alcance: implementa HU-12, HU-13 y HU-28 completas (ver `proposal.md`) en la rama `feature/implementar-dashboard`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [x] 1.1 Crear la rama `feature/implementar-dashboard` desde un `dev` actualizado y verificar con `git branch --show-current`
- [x] 1.2 Agregar en `shared/` los esquemas de consulta del dashboard (mes y moneda opcionales) y los mensajes de la spec; verificar con pruebas de `shared`

## 2. Servidor [HU-12, HU-13, HU-28]

- [x] 2.1 Crear agregaciones, servicio, vista, controlador y rutas de `GET /dashboard/monedas` y `GET /dashboard/indicadores` con `decimal.js`; verificar con pruebas "Indicadores del mes en curso", "Cambio de período", "Indicadores en cero sin movimientos", "Presupuesto utilizado y sin presupuesto", "Dashboard en la moneda principal", "Cambio de moneda" y "Selector limitado a las monedas en uso" (incluida la persona sin cuentas)
- [x] 2.2 Crear `GET /dashboard/graficos` con la evolución de 6 meses y la distribución por categoría (ocho mayores y "Otras"); verificar con pruebas "Gráficos con movimientos de 6 meses", "Distribución con monto y porcentaje", "Sin gastos: distribución vacía" y que solo cuenta la moneda elegida y los datos propios

## 3. Cliente: indicadores [HU-12, HU-28]

- [x] 3.1 Crear el dominio `dashboard/` con servicio, `useDashboard`, las tarjetas de indicadores, el selector de mes y de moneda y la integración en la pantalla de inicio; verificar con pruebas "Visualización de indicadores", "Actualización al cambiar el período", "Indicadores en cero con mensaje motivacional" y "Selector limitado a las monedas en uso"
- [x] 3.2 Mostrar el error controlado de los indicadores con reintento y conservar los datos anteriores al fallar un cambio de moneda ("No se pudieron cargar los indicadores en USD"); verificar con pruebas "Error controlado al cargar indicadores" y "Error al cambiar de moneda"

## 4. Cliente: gráficos [HU-13]

- [x] 4.1 Crear `GraficoEvolucion` y `GraficoDistribucion` con Chart.js, sus leyendas, el tooltip con nombre, monto y porcentaje y la vista de tabla; verificar con pruebas "Visualización de gráficos" y "Tooltip con nombre, monto y porcentaje"
- [x] 4.2 Mostrar el error propio de los gráficos y el estado vacío sin gastos; verificar con pruebas "Error al generar gráficos sin afectar las tarjetas" y "Estado vacío sin gastos registrados"

## 5. Documentación e integración [RT-01]

- [x] 5.1 Documentar en el README las rutas del dashboard; verificar que `npm run lint`, `npm test` y `npm run build` pasan
