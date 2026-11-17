# Spec Delta

## Purpose

Definir las convenciones observables que comparten todos los endpoints de la API REST (versionado, formato de respuestas y errores, códigos HTTP, paginación, ordenamiento y filtros), para que el frontend y cualquier cliente consuman la API de forma uniforme.

## ADDED Requirements

### Requirement: Versionado de la API
El sistema SHALL exponer todos los endpoints de la API REST bajo el prefijo `/api/v1`, y MUST responder con un error 404 en formato estándar ante cualquier ruta inexistente bajo ese prefijo.

#### Scenario: Consumo de un endpoint versionado
- **GIVEN** un usuario autenticado
- **WHEN** el frontend solicita `GET /api/v1/movimientos`
- **THEN** la API responde con el listado de movimientos del usuario

#### Scenario: Ruta inexistente
- **WHEN** un cliente solicita `GET /api/v1/ruta-que-no-existe`
- **THEN** la API responde con código 404 y un cuerpo de error con código `NOT_FOUND`

### Requirement: Formato estándar de respuestas exitosas
El sistema SHALL devolver las respuestas exitosas en JSON con el recurso dentro de la propiedad `data`. Los listados MUST incluir además una propiedad `meta` con la información de paginación. Los montos MUST viajar como texto decimal (por ejemplo `"150.00"`) junto con su código de moneda ISO 4217, para no perder precisión.

#### Scenario: Respuesta de un recurso individual
- **WHEN** el usuario consulta el detalle de una de sus cuentas
- **THEN** la API responde con código 200 y un cuerpo `{ "data": { ... } }` donde el saldo aparece como `"saldoActual": "1250.50"` y `"moneda": "PEN"`

#### Scenario: Creación de un recurso
- **WHEN** el usuario registra una nueva categoría con datos válidos
- **THEN** la API responde con código 201 y el recurso creado dentro de `data`

### Requirement: Formato estándar de errores
El sistema SHALL devolver todos los errores con el cuerpo `{ "error": { "code", "message", "details" } }`, donde `code` es un identificador estable, `message` es un mensaje en español apto para mostrarse al usuario y `details` (opcional) lista los errores por campo. Los errores inesperados MUST responder 500 sin exponer trazas ni detalles internos.

#### Scenario: Error de validación con detalle por campo
- **WHEN** el usuario envía un movimiento con monto 0 y sin fecha
- **THEN** la API responde con código 400, `code` igual a `VALIDATION_ERROR` y `details` con una entrada por cada campo inválido (`monto`: "El monto debe ser mayor a 0", `fecha`: "La fecha es obligatoria")

#### Scenario: Error interno sin filtrar detalles
- **WHEN** ocurre una falla inesperada en el servidor al procesar una solicitud
- **THEN** la API responde con código 500, `code` igual a `INTERNAL_ERROR` y un mensaje genérico, sin incluir la traza ni información de la base de datos

### Requirement: Códigos HTTP por tipo de error
El sistema SHALL usar códigos HTTP consistentes: 400 para datos inválidos, 401 para sesión ausente o expirada, 403 para falta de permisos por rol, 404 para recursos inexistentes o pertenecientes a otro usuario, 409 para conflictos (duplicados o recursos con dependencias) y 429 para bloqueos por intentos excesivos.

#### Scenario: Recurso de otro usuario
- **GIVEN** el usuario B conoce el identificador de un movimiento del usuario A
- **WHEN** el usuario B solicita ese movimiento a la API
- **THEN** la API responde con código 404 y `code` igual a `NOT_FOUND`, igual que si el recurso no existiera

#### Scenario: Conflicto por duplicado
- **WHEN** el usuario intenta crear una categoría con un nombre que ya existe para el mismo tipo
- **THEN** la API responde con código 409 y `code` igual a `CONFLICT`

#### Scenario: Sesión expirada
- **WHEN** el usuario realiza una solicitud con una sesión expirada
- **THEN** la API responde con código 401 y `code` igual a `SESSION_EXPIRED`

### Requirement: Paginación de listados
El sistema SHALL paginar los listados mediante los parámetros `page` (por defecto 1) y `limit` (por defecto 20, máximo 100), devolviendo en `meta` los valores `page`, `limit`, `total` y `totalPages`.

#### Scenario: Listado paginado con valores por defecto
- **GIVEN** el usuario tiene 45 movimientos registrados
- **WHEN** solicita el listado de movimientos sin parámetros de paginación
- **THEN** la API devuelve los primeros 20 movimientos y `meta` con `page` 1, `limit` 20, `total` 45 y `totalPages` 3

#### Scenario: Límite superior de página
- **WHEN** el usuario solicita un listado con `limit=500`
- **THEN** la API responde con código 400 y `code` igual a `VALIDATION_ERROR` indicando que el límite máximo es 100

### Requirement: Filtros y ordenamiento por parámetros de consulta
El sistema SHALL recibir filtros y ordenamiento como parámetros de consulta combinables. Las fechas MUST expresarse en formato `YYYY-MM-DD` y el ordenamiento con `sort=<campo>` (ascendente) o `sort=-<campo>` (descendente). Un parámetro con formato inválido MUST responder 400.

#### Scenario: Filtros combinados
- **WHEN** el usuario solicita `GET /api/v1/movimientos?desde=2026-08-01&hasta=2026-08-31&tipo=gasto&sort=-fecha`
- **THEN** la API devuelve solo los gastos de agosto de 2026 ordenados por fecha descendente

#### Scenario: Fecha con formato inválido
- **WHEN** el usuario envía `desde=31-08-2026`
- **THEN** la API responde con código 400 y `code` igual a `VALIDATION_ERROR` con el detalle del parámetro `desde`
