## ADDED Requirements

### Requirement: Verificar en la integración continua que cada escenario tenga su prueba
El sistema SHALL mantener un mapa entre cada escenario de `docs/historias-de-usuario.md` y las pruebas automáticas que lo verifican, SHALL generar con él la matriz `docs/cobertura-escenarios.md`, y la integración continua MUST fallar si un escenario no tiene prueba, si una prueba citada no existe o si la matriz publicada no coincide con la generada.

Origen: RT-09, requisito técnico que garantiza la regla de cierre de todas las historias (ver `docs/trazabilidad.md`).

#### Scenario: Todos los escenarios cubiertos
- **GIVEN** cada escenario del documento de historias tiene al menos una prueba en el mapa y todas existen
- **WHEN** se ejecuta la verificación de cobertura
- **THEN** la verificación termina correctamente e informa el número de escenarios cubiertos

#### Scenario: Escenario sin prueba
- **GIVEN** se agrega una historia o un escenario al documento sin agregarlo al mapa
- **WHEN** se ejecuta la verificación de cobertura
- **THEN** la verificación falla e indica qué historia y qué escenario no tienen prueba

#### Scenario: Prueba renombrada o eliminada
- **GIVEN** el mapa cita una prueba cuyo título ya no existe en el archivo indicado
- **WHEN** se ejecuta la verificación de cobertura
- **THEN** la verificación falla e indica el escenario, el archivo y el título que no encuentra

#### Scenario: Matriz desactualizada
- **GIVEN** las pruebas cambiaron de línea o el mapa cambió y la matriz publicada no se regeneró
- **WHEN** se ejecuta la verificación de cobertura en modo de comprobación
- **THEN** la verificación falla e indica el comando que regenera la matriz
