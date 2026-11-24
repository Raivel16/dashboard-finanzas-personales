# Design

## Context

Los requisitos están en `openspec/specs/consulta-movimientos/spec.md`; el motivo y el alcance, en `proposal.md`. La épica 5 dejó `GET /movimientos` con paginación, orden (`fecha` o `monto`, por defecto `-fecha`), filtros `desde`, `hasta`, `tipo`, `categoriaId`, `cuentaId` y `moneda` (todos combinables, aplicados después de calcular `saldoResultante`) y la pantalla `/movimientos` con la lista, el panel de registro y la edición. `esquemaConsultaMovimientos` ya valida el rango de fechas.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-10 y HU-11 tenga una prueba automatizada que pase, tanto en la API como en la pantalla.
- Que los filtros se combinen, reinicien la paginación y nunca cambien el saldo resultante de cada fila.

**Non-Goals:**

- Búsqueda por texto, orden por columnas desde la pantalla, filtro por moneda en la pantalla (cada fila ya muestra la suya), exportación (épica 9) y guardar filtros.

## Decisions

### 1. Sin rutas nuevas; mensaje de rango de la spec

La API ya cubre HU-10 y HU-11. Solo se cambia el mensaje de `MENSAJES.fecha.rango` a "La fecha inicial no puede ser mayor a la fecha final" (el de la spec) y se agregan pruebas de servidor que recorren los ocho escenarios: historial de al menos 10 movimientos paginado por fecha descendente con sus campos, detalle por `GET /movimientos/:id`, filtro por fecha y categoría, combinación de tipo y cuenta, rango inválido (400 con el mensaje en `desde`/`hasta`), resultado vacío (`data: []`, `total: 0`) y usuario sin movimientos.

### 2. Filtros en la pantalla

El hook `useMovimientos` guarda los **filtros aplicados** (`desde`, `hasta`, `tipo`, `categoriaId`, `cuentaId`), los envía al servicio y vuelve a la página 1 cada vez que cambian. Un hook propio, `useFiltrosMovimientos`, maneja el **borrador** del formulario de filtros: los valores que la persona está escribiendo no consultan nada hasta pulsar "Aplicar filtros". Si `desde` es posterior a `hasta`, el hook expone el mensaje "La fecha inicial no puede ser mayor a la fecha final" (el mismo texto de `shared/`) y el botón "Aplicar filtros" queda deshabilitado. "Limpiar filtros" vacía el borrador y los filtros aplicados.

### 3. Estados de la lista

- Error al cargar: "No se pudo cargar el historial. Intenta nuevamente" con el botón "Reintentar" (el mensaje de la spec reemplaza al del servidor en esta carga).
- Sin movimientos y sin filtros: "Aún no tienes movimientos registrados" con el botón "Registrar el primer movimiento" (si no hay cuentas se indica primero crear una).
- Sin coincidencias con filtros: "No se encontraron movimientos con los filtros seleccionados" con el botón "Limpiar filtros".
- Mientras se vuelve a consultar por un filtro o una página se sigue mostrando la lista anterior, para que la pantalla no parpadee.

### 4. Detalle del movimiento

Cada fila tiene un botón que abre el detalle en el mismo panel de registro (modo `detalle`): tipo, monto con signo, categoría, cuenta, fecha, descripción, saldo resultante y fecha de registro, con las acciones "Editar" y "Eliminar" (que reutilizan los flujos existentes) y "Cerrar". El detalle usa los datos que ya tiene la lista, sin otra llamada a la API.

### 5. Presentación

La pantalla mantiene el título "Movimientos" y la sección se titula "Historial de movimientos". La barra de filtros se pliega a una sola columna en el celular. Sigue `DESIGN.md` y `PRODUCT.md`; los filtros usan el `Campo` y el `Selector` compartidos.

## Risks / Trade-offs

- [Los filtros por categoría y cuenta usan las listas ya cargadas para la pantalla] → Si una cuenta se elimina en otra pestaña, la lista se actualiza al recargar; no hay riesgo de datos ajenos porque la API filtra por inquilino.
- [El saldo resultante se calcula sobre todos los movimientos aunque haya filtros] → Es lo que exige HU-26; el volumen personal lo permite (decisión de la épica 5).
