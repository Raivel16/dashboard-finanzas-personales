# Proposal

## Why

Con cuentas, categorías y movimientos listos, falta controlar el gasto: definir cuánto se quiere gastar cada mes y ver cuánto se lleva. La octava épica de `docs/trazabilidad.md` (versión `v0.8.0`) implementa los presupuestos mensuales por moneda, con presupuestos por categoría dentro del general y avisos al acercarse o superar el límite. Va antes que el dashboard porque el indicador de presupuesto (HU-12) depende de ella.

## What Changes

- Se implementa el comportamiento **ya especificado** en `presupuestos`: definir presupuestos mensuales general o por categoría con confirmación para reemplazar (HU-14); seguimiento con porcentaje, monto restante, aviso al 90 % y presupuesto excedido (HU-15); presupuestos independientes por moneda y mes, solo para el mes actual o futuros (HU-29); y presupuestos por categoría que exigen un general y no lo superan (HU-30).
- Servidor: modelo, repositorio, servicio, vista y rutas de `/api/v1/presupuestos` (listar, seguimiento, crear, reemplazar, eliminar); los movimientos de gasto devuelven en `meta.alertas` los umbrales que cruzan; eliminar una categoría con presupuestos se rechaza con 409; administración los lee con `GET /admin/usuarios/:id/presupuestos`.
- Cliente: dominio `presupuestos/` con la pantalla "Presupuestos" (mes y moneda, formulario, lista con barras de progreso y monto sin asignar) y las notificaciones de alerta al registrar o editar un gasto; el detalle de usuario de administración muestra los presupuestos.
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). Fuera de alcance: el indicador en el dashboard (épica 7), presupuestos recurrentes o copiados de un mes a otro, y alertas por correo.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de presupuestos no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevo recurso `presupuesto` en todas las capas; `movimiento.service` calcula alertas y `categoria.service` consulta presupuestos; rutas de administración.
- **Cliente**: nuevo dominio `presupuestos/`, destino en el router y la navegación; `movimientos` muestra las alertas; `administracion` muestra presupuestos.
- **Trazabilidad**: rama `feature/implementar-presupuestos`; HU-14, HU-15, HU-29 y HU-30 hechas al fusionar, y la columna de presupuestos de las obligaciones de HU-04, HU-05 y HU-22 queda cumplida.
