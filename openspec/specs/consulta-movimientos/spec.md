# consulta-movimientos Specification

## Purpose
Permitir que el usuario consulte su historial de movimientos y lo filtre por fecha, categoría, tipo y cuenta para analizar su actividad financiera.

Épica de origen: Consulta y Filtrado de Movimientos (HU-10, HU-11).

## Requirements

### Requirement: Consultar historial de movimientos financieros
El sistema SHALL mostrar al usuario un listado paginado y ordenado por fecha descendente de todos sus movimientos financieros, con acceso al detalle de cada uno.

Origen: HU-10 (ver `docs/historias-de-usuario.md`).

#### Scenario: Consulta exitosa del historial de movimientos
- **GIVEN** el usuario tiene al menos 10 movimientos registrados
- **WHEN** accede a la sección "Historial de movimientos"
- **THEN** el sistema muestra un listado paginado ordenado por fecha descendente, con tipo, categoría, cuenta, monto y descripción de cada movimiento

#### Scenario: Visualización del detalle de un movimiento
- **GIVEN** el usuario se encuentra visualizando el historial de movimientos
- **WHEN** selecciona un movimiento específico de la lista
- **THEN** el sistema despliega el detalle completo del movimiento en una vista o modal ampliada

#### Scenario: Error controlado al cargar el historial
- **GIVEN** el usuario intenta acceder a la sección de historial
- **WHEN** ocurre un error de comunicación con la API REST
- **THEN** el sistema muestra el mensaje "No se pudo cargar el historial. Intenta nuevamente" junto con una opción para reintentar la carga

#### Scenario: Visualización del historial sin movimientos
- **GIVEN** el usuario aún no ha registrado ningún movimiento financiero
- **WHEN** accede a la sección "Historial de movimientos"
- **THEN** el sistema muestra un estado vacío con el mensaje "Aún no tienes movimientos registrados" y un botón de acceso directo para crear el primero

### Requirement: Filtrar movimientos por fecha, categoría y tipo
El sistema SHALL permitir que el usuario filtre su historial de movimientos por rango de fechas, categoría, tipo de movimiento y cuenta, de forma combinable.

Origen: HU-11 (ver `docs/historias-de-usuario.md`).

#### Scenario: Filtrado exitoso por fecha y categoría
- **GIVEN** el usuario se encuentra en el historial de movimientos con múltiples registros
- **WHEN** define un rango de fechas del 01/08/2026 al 31/08/2026 y selecciona la categoría "Alimentación"
- **THEN** el sistema muestra únicamente los movimientos que cumplen simultáneamente ambos criterios de filtrado

#### Scenario: Combinación exitosa de filtros
- **GIVEN** el usuario ha aplicado un filtro por tipo "Ingreso"
- **WHEN** decide combinarlo adicionalmente con el filtro de cuenta "Cuenta Bancaria"
- **THEN** el sistema actualiza el listado mostrando solo los ingresos registrados en dicha cuenta

#### Scenario: Filtro rechazado por rango de fechas inválido
- **GIVEN** el usuario está configurando el filtro de rango de fechas
- **WHEN** ingresa una fecha de inicio posterior a la fecha de fin
- **THEN** el sistema muestra la alerta "La fecha inicial no puede ser mayor a la fecha final" y deshabilita el botón "Aplicar filtros"

#### Scenario: Resultado vacío por filtros sin coincidencias
- **GIVEN** el usuario aplica un conjunto de filtros que no coincide con ningún movimiento registrado
- **WHEN** el sistema ejecuta la búsqueda
- **THEN** se muestra el mensaje "No se encontraron movimientos con los filtros seleccionados" junto con la opción de "Limpiar filtros"
