# Tasks

> Alcance: RT-08 (UUID públicos) y RT-09 (cobertura de escenarios en CI), la guía de MongoDB Atlas, el README y el guion de la exposición, en la rama `chore/preparar-entrega-final`. Cada grupo incluye sus propias pruebas.

## 1. Identificadores UUID [RT-08]

- [x] 1.1 Cambiar el `_id` de todos los modelos a UUID v4 y las referencias a `String`; adaptar repositorios, agregaciones, regla compartida de identificador y script de datos demo
- [x] 1.2 Reemplazar los identificadores fijos de las pruebas por UUID y agregar las pruebas de los 4 escenarios de RT-08; verificar con `npm test`

## 2. Cobertura de escenarios [RT-09]

- [x] 2.1 Mover el mapa a `docs/cobertura-escenarios.json` y crear `server/scripts/cobertura-escenarios.js` con los modos generar y comprobar; probar los 4 escenarios de RT-09
- [x] 2.2 Agregar `npm run cobertura` y `npm run cobertura:comprobar`, y el paso en `.github/workflows/ci.yml`

## 3. MongoDB Atlas [RT-01, RT-06, RT-07]

- [ ] 3.1 Documentar la creación del clúster, la URI y la carga del administrador y los datos demo; verificar la conexión contra el clúster real cuando esté disponible

## 4. Documentación y cierre

- [ ] 4.1 Reescribir el README con las secciones habituales y agregar `docs/exposicion.md` alineado con la rúbrica
- [ ] 4.2 Registrar RT-08 y RT-09 en `docs/trazabilidad.md`, regenerar la matriz y verificar que lint, pruebas, compilación y `npm run cobertura:comprobar` pasan
