# Tasks

> Alcance: este cambio deja lista la base del proyecto e implementa el contrato común de la API (`contrato-api`). Los requisitos de las demás specs de este cambio (multimoneda, saldo, roles, sesión, reportes, categorías iniciales) quedan documentados aquí y se implementan en los cambios de cada historia de usuario.

## 1. Documentación y repositorio

- [ ] 1.1 Actualizar `docs/historias-de-usuario.md`: convertir "Supuestos y Vacíos Detectados" en decisiones confirmadas (HU-09 incluida, sesión de 30 min por inactividad, enlace de 30 min, umbral 90 %, administrador de solo lectura, sin categorías globales, multimoneda) y ajustar los escenarios de HU-02 y HU-04 para que coincidan con las specs de este cambio; verificar con una búsqueda que no quedan menciones a "categoría global"
- [x] 1.2 Crear `.gitignore` raíz (`node_modules/`, `.env`, `*.env.local`, `dist/`, `coverage/`, logs) y verificar con `git status` que ningún `.env` aparece como archivo a versionar
- [ ] 1.3 Proteger `main` y `dev` en GitHub (PR obligatorio con 0 aprobaciones, sin force push ni borrado) con `gh api` y verificar leyendo la protección de cada rama
- [ ] 1.4 Actualizar la regla de ramas de `CLAUDE.md` (integración a `dev` y `main` solo por pull request) y el contexto de `openspec/config.yaml` (aislamiento por `tenantId`); verificar con `openspec validate --all`

## 2. MongoDB local como replica set

- [ ] 2.1 Configurar el servicio MongoDB 9.0 local como replica set `rs0` (agregar `replication.replSetName: rs0` en `mongod.cfg`, reiniciar el servicio, ejecutar `rs.initiate()` desde mongosh de Compass) y verificar que `rs.status()` reporta un nodo `PRIMARY`

## 3. Monorepo y tooling

- [ ] 3.1 Crear `package.json` raíz con workspaces `client`, `server`, `shared`, `"type": "module"`, `engines.node >= 22` y `.nvmrc`; verificar que `npm install` en la raíz instala los tres workspaces
- [ ] 3.2 Configurar ESLint (flat config, reglas de React para `client/`) y Prettier en la raíz con scripts `lint` y `format`; verificar que `npm run lint` termina sin errores
- [ ] 3.3 Agregar scripts raíz `dev` (cliente y servidor en paralelo), `test` (todos los workspaces) y `build`; verificar que cada script se ejecuta

## 4. Paquete `shared`

- [ ] 4.1 Crear constantes compartidas (roles, tipos de movimiento, tipos de cuenta, monedas `PEN`/`USD`/`EUR`) y mensajes de error en español; verificar con pruebas unitarias que se exportan correctamente
- [ ] 4.2 Crear el validador de esquemas sobre Validator.js (`validar(esquema, datos)` que devuelve datos saneados o errores `{ campo, mensaje }`) y los esquemas base reutilizables: monto decimal positivo como texto, fecha `YYYY-MM-DD`, período `YYYY-MM`, moneda ISO 4217 soportada, contraseña segura, paginación (`page`, `limit` ≤ 100) y ordenamiento; verificar con pruebas unitarias de casos válidos e inválidos usando los mensajes de las specs

## 5. Servidor base (Express)

- [ ] 5.1 Crear `server/` con Express 5, `app.js`/`server.js` y lectura de configuración validada con los esquemas de `shared` que falla con mensaje claro si falta una variable; verificar con una prueba que la carga de configuración rechaza un entorno incompleto
- [ ] 5.2 Implementar conexión a MongoDB que verifica al arrancar que hay replica set y explica cómo corregirlo si no lo hay; verificar arrancando contra la instancia local
- [ ] 5.3 Agregar helmet, cors (origen `CLIENT_URL` con credenciales), cookie-parser, parseo JSON y logger pino; verificar con Supertest que las cabeceras de seguridad y CORS están presentes
- [ ] 5.4 Implementar clases de error de dominio, manejador central de errores (incluye duplicado de Mongoose → 409 y `CastError` → 404) y manejador 404 bajo `/api/v1`; verificar con Supertest los escenarios "Ruta inexistente", "Error interno sin filtrar detalles" y "Conflicto por duplicado" de `contrato-api`
- [ ] 5.5 Implementar middleware de validación con los esquemas de `shared` que responde `VALIDATION_ERROR` con `details` por campo; verificar con Supertest los escenarios "Error de validación con detalle por campo", "Límite superior de página" y "Fecha con formato inválido"
- [ ] 5.6 Implementar utilidades de respuesta (`{ data }`, `{ data, meta }`), paginación y ordenamiento; verificar con Supertest el escenario "Listado paginado con valores por defecto" usando una ruta de prueba
- [ ] 5.7 Implementar utilidades de dinero (`Decimal128` ↔ texto con 2 decimales, aritmética con decimal.js) y de fechas (día calendario en UTC, mes en curso según `APP_TIMEZONE`, con Day.js); verificar con pruebas unitarias de redondeo y de límites de mes
- [ ] 5.8 Implementar el repositorio base por `tenantId` y el plugin de Mongoose que rechaza consultas sin `tenantId`; verificar con pruebas sobre `MongoMemoryReplSet` que un inquilino no lee ni modifica documentos de otro y que una consulta sin `tenantId` lanza error
- [ ] 5.9 Implementar el servicio de correo con Nodemailer (SMTP por `.env`, log en desarrollo si no hay `SMTP_HOST`, transporte simulado en pruebas); verificar con una prueba que el modo sin SMTP registra el correo en el log
- [ ] 5.10 Exponer `GET /api/v1/health` con el estado de la conexión a la base de datos; verificar con Supertest y con `curl` contra el servidor local
- [ ] 5.11 Configurar Jest en modo ES Modules con Supertest y `mongodb-memory-server` (replica set); verificar que `npm test -w server` ejecuta todas las pruebas anteriores en verde

## 6. Cliente base (React + Vite)

- [ ] 6.1 Crear `client/` con Vite + React, Tailwind CSS y proxy de `/api` hacia el servidor; verificar que `npm run dev -w client` muestra la página inicial y que una llamada a `/api/v1/health` pasa por el proxy
- [ ] 6.2 Configurar React Router con layout base, página 404 y estructura `src/features/` y `src/components/`; verificar navegando entre una ruta existente y una inexistente
- [ ] 6.3 Crear el cliente HTTP (`fetch` con `credentials: 'include'`) que interpreta `{ data, meta }` y `{ error }`; verificar con pruebas Vitest que expone `code`, `message` y `details` de un error de la API
- [ ] 6.4 Instalar y configurar react-toastify, SweetAlert2, Chart.js + react-chartjs-2 y Day.js (locale `es`) y crear el Context de aplicación; verificar con una prueba Vitest que el proveedor de contexto y el contenedor de notificaciones se renderizan
- [ ] 6.5 Configurar Vitest con React Testing Library y jsdom; verificar que `npm test -w client` ejecuta las pruebas en verde

## 7. Configuración y documentación del proyecto

- [ ] 7.1 Crear `server/.env.example` y `client/.env.example` con todas las variables del diseño y valores de ejemplo seguros; verificar que el servidor arranca copiando el ejemplo y completando solo los secretos
- [ ] 7.2 Escribir `README.md` con requisitos (Node 22, MongoDB como replica set), instalación, variables de entorno, cambio a MongoDB Atlas, comandos y flujo de ramas; verificar siguiendo los pasos desde un clon limpio
- [ ] 7.3 Actualizar `CLAUDE.md` con comandos reales (incluida cómo ejecutar una sola prueba en servidor y cliente) y la arquitectura (workspaces, capas, aislamiento por `tenantId`, contrato de la API); verificar que cada comando documentado funciona

## 8. Verificación integral

- [ ] 8.1 Ejecutar `npm run lint`, `npm test` y `npm run build` desde la raíz y levantar `npm run dev`; verificar que todo pasa y que el cliente muestra el estado de `/api/v1/health` obtenido a través del proxy
- [ ] 8.2 Ejecutar `openspec validate definir-arquitectura-base --strict` y verificar que el cambio es válido

## Workflow follow-up

- Abrir un pull request de `chore/configurar-proyecto-base` hacia `dev`.
- Archivar el cambio con `openspec-archive-change` tras fusionar el PR, para sincronizar las specs principales.
- Crear los siguientes cambios por historia, empezando por autenticación (HU-01, HU-02, HU-03) y control de acceso (HU-04, HU-05).
