# Tasks

> Alcance: este cambio implementa los requisitos técnicos RT-01 a RT-07. Las historias de usuario creadas aquí se implementan en los cambios indicados en `docs/trazabilidad.md`.

## 1. Documentación y repositorio [RT-01, RT-04]

- [x] 1.1 Actualizar `docs/historias-de-usuario.md` y su versión Word agregando las historias funcionales HU-18 a HU-31 sin modificar HU-01 a HU-17; verificar que ambas contienen 31 historias y 124 escenarios
- [x] 1.2 Crear `.gitignore` raíz y verificar con `git status` que ningún `.env` aparece como archivo a versionar
- [ ] 1.3 Proteger `main` y `dev` en GitHub (pull request obligatorio con 0 aprobaciones, comprobación `verificar`, sin force push ni borrado) después de que exista la integración continua; verificar leyendo la protección de cada rama
- [x] 1.4 Actualizar `CLAUDE.md` y `openspec/config.yaml` con el flujo de ramas, la trazabilidad y el aislamiento por `tenantId`; verificar con `openspec validate --all`

## 2. MongoDB local como replica set [RT-01]

- [x] 2.1 Configurar el servicio MongoDB 9.0 local como replica set `rs0` (agregar `replication.replSetName: rs0` en `mongod.cfg`, reiniciar el servicio y ejecutar `rs.initiate()` desde mongosh de Compass); verificar que `rs.status()` reporta un nodo `PRIMARY`

## 3. Monorepo y tooling [RT-01]

- [x] 3.1 Crear `package.json` raíz con workspaces `client`, `server`, `shared`, `"type": "module"`, `engines.node >= 22` y `.nvmrc`; verificar que `npm install` instala los tres workspaces
- [x] 3.2 Configurar ESLint (flat config, reglas de React para `client/`) y Prettier con scripts `lint` y `format`; verificar que `npm run lint` termina sin errores
- [ ] 3.3 Agregar scripts raíz `dev`, `test` y `build`; verificar que cada uno se ejecuta

## 4. Paquete `shared` [RT-02, RT-03]

- [x] 4.1 Crear constantes compartidas (roles, tipos de movimiento, tipos de cuenta, monedas `PEN`/`USD`/`EUR`, categorías predeterminadas) y mensajes en español; verificar con pruebas unitarias
- [x] 4.2 Crear `validar(esquema, datos)` sobre Validator.js y los esquemas de "Reglas de validación comunes" (diseño, sección 25), paginación y ordenamiento; verificar con pruebas de casos válidos e inválidos

## 5. Servidor base [RT-01, RT-02, RT-03]

- [ ] 5.1 Crear `server/` con Express 5, la estructura MVC del diseño, `app.js`/`server.js` y configuración validada; verificar el escenario "Configuración incompleta" de RT-01
- [ ] 5.2 Implementar la conexión a MongoDB con comprobación de replica set; verificar el escenario "Base de datos sin replica set"
- [ ] 5.3 Agregar helmet, cors, cookie-parser, parseo JSON y pino; verificar con Supertest cabeceras de seguridad y CORS
- [ ] 5.4 Implementar errores de dominio y manejadores central y 404; verificar "Error interno sin filtrar detalles" y "Recurso inexistente o de otro usuario" de RT-02
- [ ] 5.5 Implementar el middleware de validación; verificar "Error de validación con detalle por campo" de RT-02 y "Límite superior de página" y "Fecha con formato inválido" de RT-03
- [ ] 5.6 Implementar la vista base `{ data }` / `{ data, meta }`, paginación, filtros y orden; verificar "Respuesta exitosa con formato estándar" de RT-02 y "Listado paginado con valores por defecto" y "Filtros combinados y orden" de RT-03
- [ ] 5.7 Implementar utilidades de dinero (`Decimal128`, decimal.js) y fechas (Day.js, `APP_TIMEZONE`); verificar con pruebas de redondeo y límites de mes
- [ ] 5.8 Implementar el repositorio base por `tenantId` y el plugin de guardia; verificar con `MongoMemoryReplSet` que un inquilino no accede a datos de otro y que una consulta sin `tenantId` falla
- [ ] 5.9 Implementar el servicio de correo con Nodemailer, registro en log sin SMTP y transporte simulado en pruebas; verificar el modo sin SMTP
- [ ] 5.10 Exponer `GET /api/v1/health` con el estado de la base de datos; verificar con Supertest
- [ ] 5.11 Configurar Jest en modo ES Modules con Supertest y `mongodb-memory-server`; verificar que `npm test -w server` pasa

## 6. Cliente base e interfaz [RT-01, RT-05]

- [ ] 6.1 Crear `client/` con Vite, React, Tailwind y proxy de `/api`; verificar que la página inicial consulta `/api/v1/health`
- [ ] 6.2 Crear la estructura Screaming Architecture y React Router con layout y página 404; verificar navegando por una ruta existente y otra inexistente
- [ ] 6.3 Crear el cliente HTTP que interpreta `{ data, meta }` y `{ error }`; verificar con Vitest
- [ ] 6.4 Definir en Tailwind los tokens de `DESIGN.md`, cargar Public Sans e IBM Plex Mono y aplicar el tema a SweetAlert2, react-toastify y Chart.js; verificar con una página de componentes en celular y escritorio
- [ ] 6.5 Crear el layout responsivo (barra lateral, navegación inferior y panel o pantalla de registro) y los componentes comunes accesibles; verificar los 4 escenarios de RT-05
- [ ] 6.6 Configurar Vitest con React Testing Library y jsdom; verificar que `npm test -w client` pasa
- [ ] 6.7 Configurar `no-restricted-imports` para los límites entre dominios; verificar que una importación prohibida hace fallar `npm run lint`

## 7. Datos de demostración y primer administrador [RT-06, RT-07]

- [ ] 7.1 Agregar a `server/package.json` las dependencias y los scripts `seed` (`node scripts/seed.js`) y `seed:admin` (`node scripts/seed.js --solo-admin`); verificar los 4 escenarios de RT-06 y de RT-07 contra MongoDB local
- [ ] 7.2 Agregar pruebas automatizadas de `server/scripts/seed.js` con `MongoMemoryReplSet`, incluida la coincidencia de saldos y la protección de entornos; verificar con `npm test -w server`

## 8. Integración continua [RT-04]

- [ ] 8.1 Crear `.github/workflows/ci.yml` con el job `verificar` (`npm ci`, lint, pruebas y compilación con Node.js 22) para pull requests hacia `dev` y `main`; verificar con un pull request real
- [ ] 8.2 Comprobar que el job falla ante una prueba rota y que corre sin `.env`; verificar en el historial de GitHub Actions

## 9. Configuración y documentación [RT-01]

- [ ] 9.1 Crear `server/.env.example` y `client/.env.example`; verificar que el servidor arranca copiando el ejemplo y completando los secretos
- [ ] 9.2 Escribir `README.md` con requisitos, instalación, replica set, Atlas, comandos, datos demo y flujo de ramas; verificar los escenarios "Proyecto levantado desde un clon limpio" y "Cambio a MongoDB Atlas"
- [ ] 9.3 Actualizar `CLAUDE.md` con los comandos reales, incluida la ejecución de una sola prueba; verificar que cada comando funciona

## 10. Verificación integral [RT-01 a RT-07]

- [ ] 10.1 Ejecutar `npm run lint`, `npm test` y `npm run build`, levantar `npm run dev` y comprobar el estado de `/api/v1/health` desde el cliente
- [ ] 10.2 Ejecutar `openspec validate definir-arquitectura-base --strict` y verificar que el cambio es válido

## Workflow follow-up

- Abrir un pull request de `chore/configurar-proyecto-base` hacia `dev`.
- Archivar el cambio con `openspec-archive-change` tras fusionarlo, para sincronizar las specs principales.
- Fusionar `dev` en `main` por pull request y etiquetar `v0.1.0`.
- Crear el cambio `implementar-autenticacion`, según `docs/trazabilidad.md`.
