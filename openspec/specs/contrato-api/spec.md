# contrato-api Specification

## Purpose
Definir las convenciones observables que comparten todos los endpoints de la API REST, para que el frontend y cualquier cliente la consuman de forma uniforme.

## Requirements

### Requirement: Recibir respuestas y errores uniformes de la API
El sistema SHALL exponer la API en /api/v1, responder { data } y { error: { code, message, details } } y usar 400, 401, 403, 404, 409 y 429 según el error. Los montos MUST viajar como texto decimal con su moneda.

Origen: RT-02, requisito técnico que habilita todas las historias (ver `docs/trazabilidad.md`).

#### Scenario: Respuesta exitosa con formato estándar
- **GIVEN** el usuario consulta una de sus cuentas
- **WHEN** solicita su detalle a la API
- **THEN** la API responde 200 con { "data": ... }, el saldo como "1250.50" y la moneda "PEN"

#### Scenario: Error de validación con detalle por campo
- **GIVEN** el usuario envía un movimiento inválido
- **WHEN** el monto es 0 y falta la fecha
- **THEN** la API responde 400, código VALIDATION_ERROR y un detalle por cada campo inválido

#### Scenario: Error interno sin filtrar detalles
- **GIVEN** ocurre una falla inesperada en el servidor
- **WHEN** se procesa una solicitud
- **THEN** la API responde 500, código INTERNAL_ERROR y un mensaje genérico, sin trazas ni datos internos

#### Scenario: Recurso inexistente o de otro usuario
- **GIVEN** el usuario B conoce el identificador de un movimiento del usuario A
- **WHEN** lo solicita a la API
- **THEN** la API responde 404 con código NOT_FOUND, igual que ante un recurso inexistente

### Requirement: Paginar y filtrar listados de forma uniforme
El sistema SHALL paginar con page (por defecto 1) y limit (por defecto 20, máximo 100), devolver meta con page, limit, total y totalPages, y aceptar filtros y sort por parámetros de consulta validados.

Origen: RT-03, requisito técnico que habilita HU-10, HU-11, HU-22 (ver `docs/trazabilidad.md`).

#### Scenario: Listado paginado con valores por defecto
- **GIVEN** el usuario tiene 45 movimientos
- **WHEN** los solicita sin parámetros
- **THEN** la API devuelve 20 movimientos y meta con page 1, limit 20, total 45 y totalPages 3

#### Scenario: Filtros combinados y orden
- **GIVEN** el usuario tiene movimientos de varios meses
- **WHEN** solicita desde=2026-08-01, hasta=2026-08-31, tipo=gasto y sort=-fecha
- **THEN** la API devuelve solo los gastos de agosto ordenados por fecha descendente

#### Scenario: Límite superior de página
- **GIVEN** el usuario solicita un listado
- **WHEN** envía limit=500
- **THEN** la API responde 400 con código VALIDATION_ERROR indicando que el máximo es 100

#### Scenario: Fecha con formato inválido
- **GIVEN** el usuario solicita un listado filtrado
- **WHEN** envía desde=31-08-2026
- **THEN** la API responde 400 con código VALIDATION_ERROR y el detalle del parámetro desde
