# Design

## Context

Los requisitos están en `openspec/specs/gestion-movimientos/spec.md`; el motivo y el alcance, en `proposal.md`. El diseño base (`openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md`) fija la colección `movimientos` (`tenantId`, `usuarioId`, `tipo`, `monto`, `moneda`, `fecha`, `categoriaId`, `cuentaId`, `descripcion`; índices `(tenantId, fecha desc)`, `(tenantId, cuentaId)`, `(tenantId, categoriaId)`), que la moneda se copia de la cuenta, que crear, editar y eliminar son transacciones que ajustan `saldoActual` con `$inc`, que el historial calcula `saldoResultante` con `$setWindowFields` y que `fecha` es un día calendario (00:00 UTC, intercambiado como `YYYY-MM-DD`, no futura en `America/Lima`).

Estado del código del que se parte:

- `shared/` ya tiene `crearEsquemaMovimiento({ hoy })` (tipo, monto, fecha, categoría, cuenta, descripción), `esquemaConsultaMovimientos` (paginación, orden por `fecha` o `monto`, filtros), `fechaHoy()` y los mensajes de monto y fecha.
- Las épicas anteriores dejaron `contarMovimientos` en los repositorios de categorías y cuentas (leen la colección `movimientos`) y la corrección del saldo inicial en `cuenta.service.js`; `decimal.js`, `RepositorioBase`, el plugin de tenant, `admin.repositorioLecturaDe` y el patrón de transacciones (`enTransaccion`) ya existen.
- El cliente tiene `Monto`, `formatearMonto`, `formatearFecha`, `PanelRegistro`, `useFormulario` y los dominios `categorias/` y `cuentas/` como modelo.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-08, HU-09, HU-26 y HU-27 tenga una prueba automatizada que pase, y que los de HU-04, HU-05 y HU-22 queden probados sobre movimientos reales.
- Que el saldo de una cuenta sea siempre `saldoInicial + Σ ingresos − Σ gastos`, aunque haya operaciones simultáneas, cambios de cuenta o interrupciones.
- Que ningún importe pase por `Number`.

**Non-Goals:**

- Pantalla de filtros y búsqueda del historial (épica 6), indicadores del dashboard (épica 7), seguimiento de presupuestos (épica 8), reportes (épica 9), transferencias entre cuentas, movimientos recurrentes, adjuntos.

## Decisions

### 1. Modelo, importes e índices

`movimiento.model.js` guarda los campos del diseño base con el plugin de tenant: `monto` como `Decimal128` (siempre positivo; el tipo da el signo), `fecha` como `Date` a las 00:00 UTC, `moneda` copiada de la cuenta y marcas de tiempo. Los tres índices del diseño base se declaran en el modelo. La vista devuelve `monto` como texto con dos decimales y `fecha` como `YYYY-MM-DD`.

### 2. Rutas bajo `/api/v1/movimientos`

`GET /movimientos` (paginado, orden por `fecha` o `monto`, filtros del esquema compartido), `POST /movimientos`, `GET /movimientos/:id`, `PATCH /movimientos/:id` y `DELETE /movimientos/:id`. El `tenantId` y el `usuarioId` salen siempre de la sesión y nunca del cuerpo. Un movimiento de otra persona o un identificador inválido responde 404 con el mensaje estándar (cumple el "403/404" de la spec sin revelar su existencia). `PATCH` acepta cualquier subconjunto de `tipo`, `monto`, `fecha`, `categoriaId`, `cuentaId` y `descripcion`; el servicio combina los valores guardados con los recibidos y valida el resultado completo con el esquema compartido, de modo que una edición que deja un campo obligatorio vacío o un monto inválido se rechaza sin alterar el registro. Si no llega ningún campo, 400.

### 3. Coherencia del movimiento (HU-27)

Dentro de la transacción, antes de escribir, el servicio comprueba con los repositorios del mismo inquilino que la cuenta y la categoría existen: si no, 400 con el error de campo "La cuenta seleccionada no existe" o "La categoría seleccionada no existe" (la misma respuesta para un id inexistente y para el de otra persona, para no revelar nada). Luego exige que el tipo de la categoría sea el del movimiento; si no, 400 en `categoriaId` con "Selecciona una categoría de ingreso" o "Selecciona una categoría de gasto". La moneda del movimiento es siempre la de su cuenta, nunca se acepta del cuerpo. La fecha no puede ser posterior a hoy en `America/Lima` (la de hoy sí); el esquema recibe el `hoy` del reloj inyectable del servidor.

### 4. Transacción y saldo (HU-08, HU-09, HU-26)

Crear, editar y eliminar se ejecutan con `enTransaccion`. El efecto de un movimiento sobre su cuenta es `+monto` (ingreso) o `−monto` (gasto):

- **Crear**: inserta y aplica el efecto con `$inc` sobre `saldoActual` de la cuenta.
- **Eliminar**: borra y aplica el efecto contrario.
- **Editar**: aplica el efecto contrario del valor guardado a la cuenta anterior y el efecto del valor nuevo a la cuenta nueva, también cuando es la misma. Si cambia la cuenta, el movimiento pasa a la moneda de la nueva ("Ahorros USD" +40.00 y "Efectivo" −40.00 en el escenario de la spec).

Los importes de `$inc` son `Decimal128` construidos con `decimal.js`. Después de ajustar, la misma transacción recalcula el saldo esperado de cada cuenta tocada (`saldoInicial + Σ ingresos − Σ gastos`, por agregación sobre el índice `(tenantId, cuentaId)`) y, si difiere del guardado, lo corrige y registra un aviso en el log, como fija el diseño base. Como todas las operaciones sobre una cuenta escriben su documento, MongoDB serializa las simultáneas (la segunda se reintenta sobre el valor ya cambiado). Si cualquier paso falla, la transacción se anula completa: nunca queda un movimiento sin descontarse ni un descuento sin movimiento.

### 5. Saldo insuficiente: aviso sin bloqueo

Un gasto cuyo monto supera el saldo de la cuenta (calculado antes de aplicarlo, y tras revertir el efecto previo si es una edición) se registra igual. La respuesta lleva `meta: { advertencias: ["El monto excede el saldo disponible de la cuenta"] }` y el cliente la muestra como aviso de atención junto a la confirmación.

### 6. Historial con saldo resultante (HU-26)

`GET /movimientos` usa una agregación, siempre con `tenantId` en el primer `$match`: `$setWindowFields` particionado por `cuentaId`, ordenado por `fecha` y `createdAt` (y `_id` de desempate) con la suma acumulada firmada de los movimientos de esa cuenta; `$lookup` del `saldoInicial` de la cuenta; `saldoResultante = saldoInicial + acumulado`. **Los filtros se aplican después de la ventana** para que el saldo de cada fila sea el real aunque se filtre; el orden pedido y la paginación van al final. Como el saldo resultante se calcula al leer, registrar un movimiento con fecha anterior corrige solo el de los posteriores sin tocar documentos, y el saldo final no cambia. La vista devuelve `saldoResultante` como texto con dos decimales.

### 7. Reemplazo de los puertos provisionales

`movimiento.repository.js` expone `contarPorCuenta` y `contarPorCategoria` (con la sesión de la transacción y siempre filtrando por `tenantId`). `cuenta.service.js` y `categoria.service.js` los usan en lugar de `contarMovimientos`, que se elimina de ambos repositorios. Sus pruebas existentes (que insertaban documentos a mano) se actualizan para usar movimientos reales por la API y se agrega la prueba de extremo a extremo de "Eliminación impedida por movimientos asociados" para cuentas y categorías, y la de "Cambio de moneda impedido".

### 8. Script `verificar-saldos`

`npm run verificar-saldos -w server` recorre todas las cuentas, calcula el saldo esperado con la misma agregación y, con `decimal.js`, imprime las que difieren (id, nombre, guardado y esperado) y termina con código 1 si hay alguna. Solo lee; no corrige. Lo prueba un test que fuerza una diferencia.

### 9. Lectura de administrador

`GET /admin/usuarios/:id/movimientos` (solo `GET`, bajo `requerirRol('admin')`) usa `admin.repositorioLecturaDe(actor, Movimiento, id)`, paginado y ordenado por `-fecha`. No existe ninguna ruta de escritura de administrador; modificar un movimiento ajeno da 404. Se prueban sobre movimientos reales HU-04, HU-05 y HU-22.

### 10. Cliente: dominio `movimientos/`

`movimientos/` tiene servicio, hooks (`useMovimientos` con carga paginada, panel de crear o editar y eliminación con `confirmar`; `useFormularioMovimiento` con las reglas de `shared/` y los selectores; `useMovimientosDeUsuario`), componentes de presentación (`ListaMovimientos`, `FormularioMovimiento`, `ListaMovimientosSoloLectura`) y la página `/movimientos`. Cada fila muestra fecha, descripción, categoría, cuenta, monto con signo y color además del texto (`+`/`−`) y su saldo resultante. El formulario pide tipo (que arranca en "Gasto"), monto, categoría (solo las del tipo elegido), cuenta, fecha (hoy por defecto, sin fechas futuras) y descripción; al cambiar el tipo se limpia la categoría y, si había una elegida, se muestra "Selecciona una categoría de ingreso" o de gasto. `cuentas/index.js` y `categorias/index.js` exportan sus funciones de lista para los selectores (API pública de cada dominio). `movimientos/index.js` exporta `ListaMovimientosSoloLectura` y `useMovimientosDeUsuario` para `administracion/`. La pantalla sigue `DESIGN.md` y `PRODUCT.md`.

## Risks / Trade-offs

- [Cada operación hace una agregación de verificación] → Usa el índice `(tenantId, cuentaId)`; aceptable para volúmenes personales (decisión del diseño base).
- [El historial recalcula el saldo acumulado de todos los movimientos de las cuentas del usuario en cada consulta] → Es correcto con cualquier filtro y evita guardar un saldo por fila que habría que reescribir al registrar con fecha anterior; el volumen personal lo permite.
- [Editar el tipo o la cuenta de un movimiento mueve dos saldos] → Se hace en una sola transacción y la verificación posterior corrige y avisa si algo no cuadra.
- [Dos monedas en el historial] → Cada fila muestra su propia moneda; no se suman montos de monedas distintas.
- [El dashboard y los presupuestos todavía no existen] → Las épicas 7 y 8 los alimentan de esta colección; aquí no hay nada que invalidar porque las pantallas leen del servidor.
