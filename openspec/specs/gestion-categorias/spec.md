# gestion-categorias Specification

## Purpose
Permitir que cada usuario administre sus propias categorías de ingresos y gastos para clasificar y analizar sus movimientos financieros.

Épica de origen: Gestión de Categorías (HU-06).

## Requirements

### Requirement: Administrar categorías de ingresos y gastos
El sistema SHALL permitir que el usuario cree, edite, liste y elimine sus categorías de ingresos y gastos, sin nombres duplicados por tipo y sin eliminar categorías con movimientos asociados.

Origen: HU-06 (ver `docs/historias-de-usuario.md`).

#### Scenario: Creación exitosa de una categoría
- **GIVEN** el usuario se encuentra en la sección "Categorías" del dashboard
- **WHEN** crea una nueva categoría de tipo "Gasto" con el nombre "Entretenimiento" y un ícono asociado
- **THEN** el sistema guarda la categoría vinculada a su userId y la muestra disponible para su selección al registrar movimientos

#### Scenario: Edición exitosa de una categoría existente
- **GIVEN** el usuario cuenta con una categoría existente llamada "Transporte"
- **WHEN** edita el nombre de la categoría a "Movilidad" y guarda los cambios
- **THEN** el sistema actualiza la categoría y refleja el nuevo nombre en todos los movimientos históricos previamente asociados

#### Scenario: Creación rechazada por nombre de categoría duplicado
- **GIVEN** el usuario intenta crear una categoría
- **WHEN** ingresa un nombre de categoría que ya existe para el mismo tipo (Ingreso/Gasto) dentro de su cuenta
- **THEN** el sistema rechaza la creación y muestra el mensaje "Ya existe una categoría con ese nombre"

#### Scenario: Eliminación impedida por movimientos asociados
- **GIVEN** el usuario intenta eliminar una categoría que tiene movimientos financieros asociados
- **WHEN** confirma la acción de eliminación
- **THEN** el sistema impide la eliminación directa y muestra la advertencia "No se puede eliminar una categoría con movimientos asociados. Reasigna o elimina los movimientos primero"
