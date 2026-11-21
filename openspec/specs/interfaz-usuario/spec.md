# interfaz-usuario Specification

## Purpose
Asegurar una experiencia consistente, responsiva y accesible en todas las pantallas de la aplicación, conforme al sistema visual del proyecto.

## Requirements

### Requirement: Usar una interfaz consistente y responsiva
El sistema SHALL aplicar en todas las pantallas el sistema visual de DESIGN.md, adaptarse a celular y escritorio, y MUST cumplir WCAG 2.2 AA en contraste, teclado, foco y estados no dependientes solo del color.

Origen: RT-05, requisito técnico que habilita todas las historias con pantalla (ver `docs/trazabilidad.md`).

#### Scenario: Registro rápido en celular
- **GIVEN** el usuario usa un celular
- **WHEN** toca "Registrar" en la navegación inferior
- **THEN** se abre el formulario a pantalla completa con el monto primero y teclado numérico

#### Scenario: Trabajo en escritorio
- **GIVEN** el usuario revisa su historial en una computadora
- **WHEN** selecciona "Registrar movimiento"
- **THEN** el formulario se abre en un panel lateral sin perder el historial

#### Scenario: Error comprensible
- **GIVEN** un formulario contiene un dato inválido
- **WHEN** el usuario intenta guardarlo
- **THEN** el campo se marca con ícono y texto, y el foco se dirige al primer error

#### Scenario: Movimiento reducido y uso con teclado
- **GIVEN** el usuario navega con teclado y prefiere menos movimiento
- **WHEN** registra un movimiento
- **THEN** todos los controles tienen foco visible y el sello "Asentado" aparece sin animación
