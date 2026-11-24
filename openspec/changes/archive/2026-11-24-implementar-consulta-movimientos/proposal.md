# Proposal

## Why

Con los movimientos ya registrados, falta poder encontrarlos: ver el historial completo con su detalle y filtrarlo por fecha, categoría, tipo y cuenta para analizar la actividad. La épica 5 dejó la lista de movimientos y un listado de la API que ya acepta los filtros; esta sexta épica de `docs/trazabilidad.md` (versión `v0.7.0`) agrega la consulta completa en la pantalla y prueba de extremo a extremo sus escenarios.

## What Changes

- Se implementa el comportamiento **ya especificado** en `consulta-movimientos`: historial paginado y ordenado por fecha descendente con acceso al detalle de cada movimiento, error controlado con reintento y estado vacío con acceso directo para crear el primero (HU-10); y filtros combinables por rango de fechas, categoría, tipo y cuenta, con validación del rango y estado "sin resultados" con "Limpiar filtros" (HU-11).
- Servidor: no se agregan rutas; `GET /api/v1/movimientos` ya filtra y pagina. Se ajusta el mensaje del rango de fechas inválido a "La fecha inicial no puede ser mayor a la fecha final" (el de la spec) y se prueban de extremo a extremo los escenarios de HU-10 y HU-11 sobre la API.
- Cliente: la pantalla "Movimientos" pasa a ser el "Historial de movimientos": barra de filtros (desde, hasta, tipo, categoría y cuenta) con "Aplicar filtros" y "Limpiar filtros", detalle del movimiento en el panel de registro con las acciones de editar y eliminar, mensajes de error y de estado vacío de la spec.
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). Fuera de alcance: búsqueda de texto, ordenar por columnas desde la pantalla, exportar el historial (épica 9) y guardar filtros.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de consulta-movimientos no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: solo el mensaje de rango en `shared/` y nuevas pruebas; no hay rutas ni modelos nuevos.
- **Cliente**: `movimientos/` agrega el hook de filtros, los componentes de filtros y detalle y ajusta `useMovimientos` y `ListaMovimientos`; el servicio acepta los filtros.
- **Trazabilidad**: rama `feature/implementar-consulta-movimientos`; HU-10 y HU-11 hechas al fusionar.
