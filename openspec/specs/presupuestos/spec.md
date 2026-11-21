# presupuestos Specification

## Purpose
Permitir que el usuario defina presupuestos mensuales (generales o por categoría) y haga seguimiento de su cumplimiento para controlar sus gastos.

Épica de origen: Presupuestos (HU-14, HU-15).

## Requirements

### Requirement: Definir presupuesto mensual
El sistema SHALL permitir que el usuario defina un presupuesto mensual general o por categoría de gasto, con montos mayores a cero y confirmación antes de reemplazar uno existente.

Origen: HU-14 (ver `docs/historias-de-usuario.md`).

#### Scenario: Definición exitosa de presupuesto mensual
- **GIVEN** el usuario se encuentra en la sección "Presupuesto"
- **WHEN** define un presupuesto mensual de 1500.00 para el mes en curso y lo guarda
- **THEN** el sistema almacena el presupuesto asociado a su userId y al período seleccionado, y lo muestra disponible para su seguimiento

#### Scenario: Asignación exitosa de presupuesto por categoría
- **GIVEN** el usuario ya cuenta con un presupuesto general definido para el mes
- **WHEN** adicionalmente asigna un sub-presupuesto de 300.00 a la categoría "Entretenimiento"
- **THEN** el sistema registra el presupuesto por categoría y lo utiliza para el seguimiento específico de dicha categoría

#### Scenario: Presupuesto rechazado por monto inválido
- **GIVEN** el usuario intenta definir un presupuesto mensual
- **WHEN** ingresa un monto negativo o deja el campo vacío
- **THEN** el sistema bloquea el guardado y muestra el mensaje "El presupuesto debe ser un monto mayor a 0"

#### Scenario: Confirmación para reemplazar un presupuesto existente
- **GIVEN** el usuario intenta definir un nuevo presupuesto para un mes que ya tiene un presupuesto previamente configurado
- **WHEN** confirma el guardado
- **THEN** el sistema le solicita confirmación explícita "Ya existe un presupuesto para este mes, ¿deseas reemplazarlo?" antes de sobrescribir el valor anterior

### Requirement: Seguimiento del cumplimiento del presupuesto
El sistema SHALL mostrar el porcentaje de avance del gasto respecto al presupuesto del mes y advertir al usuario cuando alcance el umbral de alerta o lo exceda.

Origen: HU-15 (ver `docs/historias-de-usuario.md`).

#### Scenario: Visualización exitosa del avance del presupuesto
- **GIVEN** el usuario tiene un presupuesto mensual de 1500.00 definido y ha registrado gastos por 900.00 en el mes en curso
- **WHEN** accede al indicador de seguimiento de presupuesto en el dashboard
- **THEN** el sistema muestra una barra de progreso indicando 60% de presupuesto utilizado y el monto restante disponible (600.00)

#### Scenario: Notificación al alcanzar el umbral de alerta
- **GIVEN** el usuario ha alcanzado el 90% de su presupuesto mensual
- **WHEN** el sistema detecta dicho umbral
- **THEN** muestra una notificación tipo Toastify de advertencia "Has utilizado el 90% de tu presupuesto mensual"

#### Scenario: Seguimiento no disponible sin presupuesto definido
- **GIVEN** el usuario no ha definido ningún presupuesto para el mes en curso
- **WHEN** intenta visualizar el indicador de seguimiento de presupuesto
- **THEN** el sistema muestra el mensaje "No has definido un presupuesto para este mes" junto con un acceso directo para crearlo

#### Scenario: Visualización del presupuesto excedido
- **GIVEN** el usuario ha registrado gastos que superan el 100% del presupuesto mensual definido
- **WHEN** visualiza el indicador de seguimiento
- **THEN** el sistema muestra la barra de progreso al límite en color de alerta (rojo), indica el porcentaje excedido (por ejemplo 115%) y el monto sobregirado

### Requirement: Definir presupuestos por moneda y período
El sistema SHALL asociar cada presupuesto a una moneda y a un mes, medir su avance solo con gastos de esa moneda y mes, y permitir definirlo solo para el mes actual o meses futuros.

Origen: HU-29 (ver `docs/historias-de-usuario.md`).

#### Scenario: Presupuestos independientes por moneda
- **GIVEN** el usuario tiene presupuestos de 1500.00 PEN y 200.00 USD para el mes
- **WHEN** registra un gasto de 50.00 USD
- **THEN** el avance en USD sube a 25 % y el de PEN no cambia

#### Scenario: Gastos en otra moneda no cuentan
- **GIVEN** el usuario solo tiene un presupuesto de 1500.00 PEN
- **WHEN** registra gastos por 300.00 USD
- **THEN** el porcentaje utilizado en PEN no cambia

#### Scenario: Mes pasado rechazado
- **GIVEN** el usuario define un presupuesto
- **WHEN** selecciona un mes anterior al actual
- **THEN** el sistema lo rechaza con el mensaje "Solo puedes definir presupuestos para el mes actual o meses futuros"; los presupuestos pasados se pueden consultar

#### Scenario: Presupuesto en una moneda sin gastos
- **GIVEN** el usuario definió un presupuesto en "EUR" y no tiene gastos en esa moneda
- **WHEN** consulta su seguimiento
- **THEN** el sistema muestra 0 % utilizado y el monto completo disponible

### Requirement: Mantener los presupuestos por categoría dentro del general
El sistema SHALL exigir un presupuesto general del mismo mes y moneda antes de crear presupuestos por categoría, y MUST impedir que la suma de estos supere al general. Cada presupuesto tiene su propio seguimiento.

Origen: HU-30 (ver `docs/historias-de-usuario.md`).

#### Scenario: Presupuesto por categoría dentro del general
- **GIVEN** el usuario tiene un presupuesto general de 1500.00 PEN y categorías que suman 1000.00
- **WHEN** asigna 300.00 a "Entretenimiento"
- **THEN** el sistema lo guarda y muestra 200.00 sin asignar

#### Scenario: Gasto sin presupuesto de categoría
- **GIVEN** la categoría "Salud" no tiene presupuesto propio
- **WHEN** el usuario registra un gasto en "Salud"
- **THEN** el gasto cuenta para el presupuesto general

#### Scenario: Suma superior al presupuesto general
- **GIVEN** el usuario tiene 200.00 sin asignar
- **WHEN** intenta asignar 300.00 a una categoría
- **THEN** el sistema lo rechaza con el mensaje "La suma por categorías supera el presupuesto general"

#### Scenario: Reducción del general por debajo de lo asignado
- **GIVEN** las categorías suman 1300.00
- **WHEN** el usuario intenta reducir el presupuesto general a 1000.00
- **THEN** el sistema lo rechaza con el mensaje "El presupuesto general no puede ser menor a lo asignado por categorías"
