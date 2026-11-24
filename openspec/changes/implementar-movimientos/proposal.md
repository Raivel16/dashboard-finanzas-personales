# Proposal

## Why

Con categorías y cuentas disponibles, ya se puede registrar el dato central de la aplicación: el movimiento financiero (ingreso o gasto). Sin movimientos no hay historial, presupuestos ni dashboard, y las cuentas no mueven su saldo. Esta es la quinta épica de `docs/trazabilidad.md` (versión `v0.6.0`) y, como tercer recurso de datos, debe cumplir las obligaciones de acceso de administrador y retirar los puertos provisionales que dejaron las épicas de categorías y cuentas.

## What Changes

- Se implementa, en servidor y cliente, el comportamiento **ya especificado** en `gestion-movimientos`: registrar movimientos con aviso de saldo insuficiente (HU-08), editarlos y eliminarlos sin tocar los de otra persona (HU-09), mantener el saldo de la cuenta siempre igual a saldo inicial más ingresos menos gastos, con el saldo que dejó cada movimiento (HU-26), y validar la coherencia del movimiento: moneda de su cuenta, categoría del mismo tipo, cuentas y categorías propias y fechas no futuras (HU-27).
- Servidor: modelo, repositorio, servicio, controlador, vista y rutas `GET/POST /api/v1/movimientos` y `GET/PATCH/DELETE /api/v1/movimientos/:id`. Crear, editar y eliminar ocurren en una **transacción** que guarda el movimiento y ajusta el `saldoActual` de las cuentas afectadas (la de origen y la de destino si se cambia de cuenta); si algo falla no queda ni el movimiento ni el cambio de saldo. El historial devuelve `saldoResultante` por movimiento calculado con `$setWindowFields` por cuenta (fecha y orden de registro) antes de aplicar los filtros.
- El listado acepta ya los filtros del esquema compartido `esquemaConsultaMovimientos` (fechas, tipo, categoría, cuenta y moneda), porque el saldo resultante debe ser correcto aunque haya filtros; la pantalla de filtros y la búsqueda son de la épica 6.
- Se agrega `npm run verificar-saldos -w server`, que compara el saldo de cada cuenta con la fórmula del diseño base y lista las diferencias.
- Los puertos provisionales `contarMovimientos` de `categoria.repository.js` y `cuenta.repository.js` se reemplazan por el repositorio de movimientos, y las reglas "no eliminar con movimientos asociados" y "moneda fija" se prueban de extremo a extremo con movimientos reales.
- Cliente: dominio `movimientos/` con la sección "Movimientos" (lista reciente con su saldo resultante, formulario "Nuevo movimiento" en el panel de registro, edición y eliminación con confirmación de SweetAlert2 y la advertencia de saldo insuficiente) y destino "Movimientos" en el menú.
- **Obligaciones de acceso de administrador (HU-04, HU-05, HU-22)**: `GET /api/v1/admin/usuarios/:id/movimientos` con `repositorioLecturaDe`, sección "Movimientos" de solo lectura en el detalle de usuario y pruebas de esos escenarios sobre movimientos reales.
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). Fuera de alcance: la pantalla de filtros y búsqueda del historial (épica 6), el recálculo del dashboard y del seguimiento de presupuestos, que se alimentan de estos movimientos en las épicas 7 y 8 (las pantallas leen siempre del servidor, así que no hay nada que "recalcular" aquí), y los reportes.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de gestion-movimientos no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevos `movimiento.model.js`, `movimiento.repository.js`, `movimiento.service.js`, `movimiento.controller.js`, `movimiento.view.js` y `movimientos.routes.js`; `cuenta.service.js` y `categoria.service.js` cuentan movimientos con el nuevo repositorio; `admin.routes.js` agrega la lectura de movimientos de otra persona; nuevo script `verificar-saldos`.
- **Shared**: mensajes de movimiento y esquema `esquemaActualizarMovimiento`; los mensajes de categoría y cuenta inexistentes.
- **Cliente**: nuevo dominio `movimientos/` (con un componente de solo lectura que `administracion/` reutiliza por su `index.js`); `cuentas/` y `categorias/` exportan sus servicios de lista para los selectores; `router/` registra `/movimientos`.
- **Datos**: colección `movimientos` con los índices `(tenantId, fecha desc)`, `(tenantId, cuentaId)` y `(tenantId, categoriaId)`; `monto` como `Decimal128`.
- **Trazabilidad**: rama `feature/implementar-movimientos`; HU-08, HU-09, HU-26 y HU-27 hechas al fusionar; HU-04, HU-05 y HU-22 siguen parciales hasta presupuestos.
