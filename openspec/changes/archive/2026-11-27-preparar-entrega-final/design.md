# Design

## Contexto

La base técnica (`definir-arquitectura-base`) dejó las referencias entre colecciones como `ObjectId` (§ "Modelo de datos") y usa la librería `uuid` solo para el `tenantId`. La API ya trata los identificadores como texto: las vistas devuelven `id` y el cliente nunca interpreta su formato. La matriz `docs/cobertura-escenarios.md` se generaba con un script local fuera del repositorio.

## Decisiones

### 1. El `_id` de cada documento es un UUID v4

Se reemplaza el `_id` de `ObjectId` por un `String` con valor por defecto `uuid.v4()` en todos los modelos (usuario, cuenta, categoría, movimiento, presupuesto, sesión y token de recuperación). Las referencias (`usuarioId`, `cuentaId`, `categoriaId`) pasan a `String`.

- **Por qué el propio `_id` y no un campo `uuid` adicional**: con un campo aparte habría que traducir cada referencia entre el identificador público y el interno en todos los servicios. Usar el UUID como `_id` mantiene un único identificador, indexado por MongoDB, sin capa de traducción.
- **Generación en el servidor**: el valor por defecto lo pone el modelo y `_id` sigue en los campos protegidos del plugin de inquilino, así que un cuerpo con `id` o `_id` se ignora.
- **Validación**: los repositorios responden "no encontrado" sin consultar si el identificador no es un UUID (antes lo hacían con `isValidObjectId`); la regla compartida de identificador usa `validator.isUUID(t, 4)`.
- **Orden estable**: los listados ya desempatan por `_id` después de `createdAt` o `fecha`; con UUID el desempate sigue siendo determinista, aunque no cronológico, lo que basta porque el criterio principal es la fecha.

### 2. Cobertura de escenarios como dato y verificación en CI

- El mapa escenario → pruebas vive en `docs/cobertura-escenarios.json` (`{ "HU-01": { "1": [["server/tests/registro.test.js", "título de la prueba"]] } }`).
- `server/scripts/cobertura-escenarios.js` lee `docs/historias-de-usuario.md`, busca cada título en su archivo (en una línea con `it(` o `test(`) y escribe la matriz con enlaces a la línea. Con `--comprobar` no escribe: falla si algo falta o si la matriz publicada difiere de la generada.
- La lógica se exporta como funciones puras para probar los 4 escenarios con archivos de ejemplo, sin depender del documento real.
- CI ejecuta `npm run cobertura:comprobar` después de las pruebas.

### 3. MongoDB Atlas sin cambios de código

Atlas es un replica set, así que las transacciones funcionan igual que en local. Basta con poner la URI `mongodb+srv://…/finanzas` en `MONGODB_URI`. El primer administrador se crea con `npm run seed:admin -w server` y los datos demo con `npm run seed -w server -- --permitir-remoto`, la autorización explícita que ya exige RT-06. Las credenciales del clúster quedan solo en `server/.env`, que no se versiona.

## Riesgos

- [Una base local con datos creados con `ObjectId` deja de funcionar] → Se documenta volver a ejecutar el seed; Atlas empieza vacío.
- [El mapa de cobertura se desactualiza al renombrar pruebas] → Es justamente lo que detecta CI; el mensaje indica el comando para regenerar la matriz.
