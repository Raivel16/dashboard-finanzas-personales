# Tasks

> Alcance: implementa HU-14, HU-15, HU-29 y HU-30 completas (ver `proposal.md`) en la rama `feature/implementar-presupuestos`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [ ] 1.1 Crear la rama `feature/implementar-presupuestos` desde un `dev` actualizado y verificar con `git branch --show-current`
- [ ] 1.2 Agregar en `shared/` los mensajes de presupuestos de la spec y de las alertas; verificar con pruebas de `shared`

## 2. Servidor: definir presupuestos [HU-14, HU-29, HU-30]

- [ ] 2.1 Crear modelo, repositorio, vista y rutas de `/presupuestos` con el índice único y el aislamiento por `tenantId`; verificar con pruebas de aislamiento (404 a ajenos)
- [ ] 2.2 Implementar en el servicio, en transacción, `crear`, `reemplazar` y `eliminar` con las reglas de monto, mes actual o futuro, general antes que categorías y suma dentro del general; verificar con pruebas "Definición exitosa", "Asignación por categoría", "Monto inválido", "Mes pasado rechazado", "Suma superior al general" y "Reducción del general por debajo de lo asignado"
- [ ] 2.3 Rechazar eliminar una categoría con presupuestos y exponer `GET /admin/usuarios/:id/presupuestos`; verificar con pruebas de 409 y de solo lectura del administrador

## 3. Servidor: seguimiento y alertas [HU-15, HU-29, HU-30]

- [ ] 3.1 Implementar `GET /presupuestos/seguimiento` con agregación por mes, moneda y categoría y cálculos con `decimal.js`; verificar con pruebas "Avance 60 %", "Presupuestos independientes por moneda", "Gastos en otra moneda no cuentan", "Moneda sin gastos", "Gasto sin presupuesto de categoría cuenta para el general", "Presupuesto excedido" y "Sin presupuesto"
- [ ] 3.2 Devolver `meta.alertas` al crear o editar un gasto que cruza 90 % o 100 %; verificar con pruebas "Notificación al alcanzar el umbral" y que no se repite si ya estaba cruzado

## 4. Cliente [HU-14, HU-15, HU-29, HU-30]

- [ ] 4.1 Crear el dominio `presupuestos/` con servicio, `usePresupuestos`, la pantalla "Presupuestos" (mes, moneda y lista con barras de progreso) y el destino en el router y la navegación; verificar con pruebas "Visualización del avance", "Presupuesto excedido" y "Sin presupuesto definido" con acceso directo
- [ ] 4.2 Crear `useFormularioPresupuesto` y el formulario (general o por categoría) con la confirmación para reemplazar y el mensaje de monto inválido; verificar con pruebas "Definición exitosa", "Monto inválido", "Confirmación para reemplazar", "Mes pasado rechazado" y "Suma superior al general"
- [ ] 4.3 Mostrar el monto sin asignar y las alertas al registrar o editar un gasto en `movimientos`; mostrar los presupuestos en el detalle de usuario de administración; verificar con pruebas de notificación y de solo lectura

## 5. Documentación e integración [RT-01]

- [ ] 5.1 Documentar en el README las rutas de presupuestos y actualizar la tabla de obligaciones de `docs/trazabilidad.md`; verificar que `npm run lint`, `npm test` y `npm run build` pasan
