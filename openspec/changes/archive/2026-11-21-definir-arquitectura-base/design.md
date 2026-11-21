# Design

## Context

El repositorio solo contiene requisitos (historias de usuario y specs). El enunciado del curso (`docs/Proyecto - Dashboard de Finanzas Personales.pdf`) exige arquitectura cliente-servidor con API REST en Node.js + Express, capas Controller–Service–Repository, autorización centralizada en servicios, aislamiento de datos por `userId`/`tenantId` en el repositorio, preparación SaaS multiinquilino y RBAC; y recomienda librerías concretas (Chart.js, Day.js, SweetAlert2, Toastify, SheetJS, jsPDF, Validator.js, UUID, JWT con express-jwt o passport-jwt). El enunciado menciona SQLite, pero el equipo decidió usar **MongoDB** (MERN), que es además lo que pide el entregable final (MongoDB Atlas). Entorno del equipo: Windows, Node.js 22, MongoDB 9.0 local como servicio y MongoDB Compass.

Las decisiones del equipo que este diseño concreta están en `proposal.md`; los comportamientos observables, en las specs de este cambio.

## Goals / Non-Goals

**Goals:**
- Dejar una estructura de proyecto ejecutable (cliente, servidor, código compartido) con lint, formato y pruebas funcionando, sobre la que cada historia se implemente como un cambio OpenSpec propio.
- Fijar los mecanismos transversales que todas las historias reutilizan: aislamiento por inquilino, autenticación/autorización, manejo de montos y monedas, contrato de la API y manejo de errores.
- Poder pasar de MongoDB local a Atlas, y desplegar más adelante, cambiando solo variables de entorno.

**Non-Goals:**
- Implementar historias de usuario o requisitos técnicos distintos de RT-01 a RT-07: cada grupo tiene su propio cambio, indicado en `docs/trazabilidad.md`.
- Conversión entre monedas o tipos de cambio.
- Despliegue real (solo se deja preparado).
- Familias o inquilinos con varios usuarios: hoy cada usuario es su propio inquilino; el modelo solo deja la puerta abierta.

## Decisions

### 1. Monorepo con npm workspaces: `client/`, `server/`, `shared/`
Un solo repositorio con `package.json` raíz que declara los workspaces y scripts comunes (`dev`, `test`, `lint`, `format`). `shared/` contiene los esquemas de validación (basados en Validator.js), constantes (roles, tipos de movimiento, tipos de cuenta, monedas soportadas) y mensajes de error en español, usados por cliente y servidor para que las validaciones y mensajes de las specs sean idénticos en ambos lados (DRY).
- Todo en **JavaScript con ES Modules** (`"type": "module"`), sin TypeScript (decisión del equipo).
- Node.js 22 LTS, fijado en `.nvmrc` y `engines`.
- *Alternativa descartada*: dos repositorios separados. Complica compartir validaciones y coordinar cambios que tocan API y UI a la vez.

### 2. Backend: Express 5 con arquitectura MVC
El backend sigue el patrón **Modelo–Vista–Controlador** (decisión del equipo), organizado por capa. Para cumplir también lo que pide el enunciado (capas Controller–Service–Repository, autorización en servicios y aislamiento en el repositorio), la capa **Modelo** se subdivide en modelos, servicios y repositorios:

```
server/src/
  app.js                 # arma la app Express (middlewares, rutas, manejador de errores)
  server.js              # conecta a MongoDB y levanta el servidor
  config/                # lectura y validación de variables de entorno
  routes/                # una ruta por recurso; conecta URL + middlewares + controlador
  controllers/           # C: lee la solicitud, llama al servicio y entrega el resultado a la vista
  views/                 # V: arma la representación JSON de cada recurso
  models/                # M: esquemas Mongoose (estructura, índices, plugins)
  services/              # M: reglas de negocio y autorización por rol
  repositories/          # M: único acceso a los modelos, siempre filtrado por tenantId
  middlewares/           # autenticación, autorización por rol, validación, errores
  utils/                 # errores, logger, utilidades de dinero y fechas
```
Cada recurso (`auth`, `usuarios`, `categorias`, `cuentas`, `movimientos`, `presupuestos`, `dashboard`, `reportes`, `admin`) tiene un archivo por capa con el mismo nombre (`movimiento.controller.js`, `movimiento.view.js`, `movimiento.model.js`, `movimiento.service.js`, `movimiento.repository.js`, `movimientos.routes.js`).

- **Vista**: como la aplicación es una API REST, la vista no es HTML sino la representación JSON de la respuesta. Las vistas reciben documentos del dominio y devuelven objetos planos listos para el contrato (`{ data, meta }`, montos `Decimal128` como texto, fechas `YYYY-MM-DD`, sin campos internos como `passwordHash` o `tenantId`). Los reportes PDF y Excel son también vistas del recurso `reportes`.
- **Flujo**: ruta → middlewares → controlador → servicio → repositorio → modelo; el controlador pasa el resultado a la vista y responde.
- **Reglas de dependencia**: los controladores no acceden a modelos ni repositorios; los servicios no conocen `req`/`res`; solo los repositorios usan los modelos Mongoose; las vistas no contienen lógica de negocio.
- Nombres de dominio en español (`movimiento`, `cuenta`, `presupuesto`); sufijos de capa y términos técnicos genéricos en inglés.
- *Alternativa descartada*: carpetas por módulo (`modules/<modulo>/`). Agrupa mejor cada historia, pero el equipo eligió MVC, que se expresa más claramente con una carpeta por capa.

### 3. Aislamiento multiinquilino por `tenantId` en el repositorio
- Al registrarse, cada usuario recibe un `tenantId` (UUID v4, librería `uuid`). Todo documento de datos financieros guarda `tenantId` y `usuarioId` (quién lo creó).
- Cada repositorio de datos financieros se construye con el `tenantId` del usuario autenticado y **toda** consulta, actualización y borrado agrega ese filtro; no existen métodos sin él.
- Red de seguridad: un plugin de Mongoose aplicado a los modelos de inquilino lanza un error si se ejecuta una consulta sin `tenantId` en el filtro.
- El panel de administración usa un repositorio aparte, de **solo lectura**, que recibe el `tenantId` del usuario consultado de forma explícita; no expone métodos de escritura sobre datos financieros.
- Un recurso de otro inquilino es indistinguible de uno inexistente (404, ver `contrato-api`).
- *Por qué `tenantId` y no solo `usuarioId`*: el enunciado pide preparación SaaS para "núcleos familiares"; agrupar por `tenantId` permite en el futuro varios usuarios por inquilino sin migrar datos.

### 4. Modelo de datos (colecciones)
| Colección | Campos principales | Índices |
|---|---|---|
| `usuarios` | `tenantId`, `nombre`, `email` (minúsculas), `passwordHash`, `rol` (`usuario`/`admin`), `monedaPrincipal`, `intentosFallidos`, `bloqueadoHasta`, `activo` | `email` único, `tenantId` único |
| `categorias` | `tenantId`, `usuarioId`, `nombre`, `tipo` (`ingreso`/`gasto`), `icono` | único `(tenantId, tipo, nombre)` sin distinguir mayúsculas |
| `cuentas` | `tenantId`, `usuarioId`, `nombre`, `tipo` (`efectivo`/`banco`/`tarjeta_credito`/`billetera_digital`), `moneda`, `saldoInicial`, `saldoActual` | único `(tenantId, nombre)` |
| `movimientos` | `tenantId`, `usuarioId`, `tipo`, `monto`, `moneda`, `fecha`, `categoriaId`, `cuentaId`, `descripcion` | `(tenantId, fecha desc)`, `(tenantId, cuentaId)`, `(tenantId, categoriaId)` |
| `presupuestos` | `tenantId`, `usuarioId`, `periodo` (`YYYY-MM`), `moneda`, `categoriaId` (nulo = general), `monto` | único `(tenantId, periodo, moneda, categoriaId)` |
| `sesiones` | `usuarioId`, `tokenHash`, `expiraInactividad`, `expiraAbsoluta`, `revocadaEn` | TTL sobre `expiraAbsoluta` |
| `tokensrecuperacion` | `usuarioId`, `tokenHash`, `expiraEn`, `usadoEn` | TTL sobre `expiraEn` |

Todos con `timestamps`. Las referencias entre colecciones son `ObjectId`; la integridad (categoría y cuenta del mismo inquilino, categoría del tipo correcto) se valida en el servicio.

### 5. Montos con `Decimal128` y aritmética con decimal.js
- Todo monto se guarda como `Decimal128` (decisión del equipo) para evitar errores de redondeo.
- Las sumas por período, categoría y moneda se hacen con agregaciones de MongoDB (`$sum` opera sobre `Decimal128`); los cálculos en JavaScript (porcentaje de presupuesto, montos restantes) usan **decimal.js**, nunca `Number`.
- En JSON los montos viajan como texto con 2 decimales (`"150.00"`); el cliente solo los formatea con `Intl.NumberFormat` según la moneda.
- *Alternativa descartada*: céntimos enteros. Es igual de seguro, pero el equipo eligió `Decimal128`.

### 6. Multimoneda sin conversión
- Monedas soportadas como constante en `shared/` (inicialmente `PEN`, `USD`, `EUR`); ampliar la lista no requiere cambios de modelo.
- La moneda vive en la cuenta; el movimiento copia la moneda de su cuenta al guardarse (permite filtrar y agregar sin `$lookup`).
- Dashboard, presupuestos y reportes siempre agregan filtrando o agrupando por moneda. `monedaPrincipal` del usuario (por defecto `PEN`, editable en su perfil según HU-20) define la moneda inicial del dashboard.

### 7. Saldo de cuenta consistente con transacciones
- Crear, editar o eliminar un movimiento se hace en una **transacción de MongoDB** que guarda el movimiento y ajusta `saldoActual` de las cuentas afectadas con `$inc`.
- Dentro de la misma transacción se recalcula el saldo esperado (`saldoInicial + Σ ingresos − Σ gastos`, por agregación) y, si difiere del almacenado, se corrige y se registra un aviso en el log (ver spec `gestion-cuentas`). Además se expone un script `npm run verificar-saldos -w server` para revisar todas las cuentas.
- El historial entrega `saldoResultante` por movimiento, calculado con `$setWindowFields` por cuenta, ordenando por `fecha` y `createdAt` antes de aplicar los filtros de la consulta (HU-26).
- **Las transacciones requieren replica set**. Atlas siempre lo es; en local se configura el servicio MongoDB como replica set de un nodo (`rs0`). Las pruebas usan `MongoMemoryReplSet`.
- *Alternativa descartada*: solo calcular el saldo al leer. Es siempre correcto, pero el equipo pidió guardarlo y verificar que coincida.

### 8. Autenticación: JWT en cookies `httpOnly` con token de renovación
- **Token de acceso**: JWT firmado (HS256) de 15 minutos con `sub` (usuarioId), `tenantId` y `rol`, en la cookie `access_token`. Se valida con **express-jwt** leyendo la cookie.
- **Token de renovación**: valor aleatorio opaco (no JWT) en la cookie `refresh_token` con `path=/api/v1/auth`. En BD se guarda solo su hash SHA-256 en `sesiones`. Cada renovación lo **rota** y extiende la inactividad 30 minutos; tope absoluto de 7 días. Reutilizar un token ya rotado revoca la sesión.
- La expiración por inactividad de 30 minutos (spec `autenticacion-usuarios`) la da `expiraInactividad`: si el usuario no hace nada durante 30 minutos, la renovación falla y la API responde 401 `SESSION_EXPIRED`.
- El cliente, ante un 401 `TOKEN_EXPIRED` del token de acceso, llama una vez a `POST /api/v1/auth/refresh` y reintenta la solicitud.
- Cookies: `httpOnly`, `secure` en producción, `sameSite=lax`. En desarrollo el servidor de Vite hace de proxy de `/api`, así cliente y API comparten origen.
- Cierre de sesión: revoca la sesión en BD y borra ambas cookies.
- Contraseñas con **bcrypt** (costo 12). Política: mínimo 8 caracteres, una mayúscula y un número (esquema compartido).
- **Bloqueo por intentos** (HU-02): contadores en el propio documento del usuario (`intentosFallidos`, `bloqueadoHasta`). Al tercer fallo consecutivo se bloquea 5 minutos (429); un inicio de sesión exitoso reinicia el contador. Se eligió el documento del usuario porque es atómico, no requiere otra colección y sobrevive a reinicios del servidor (a diferencia de un contador en memoria).
- **Recuperación de contraseña**: token aleatorio de 32 bytes enviado por correo; en BD solo su hash, con expiración de 30 minutos y uso único. Al restablecer se revocan todas las sesiones del usuario.
- *Alternativas descartadas*: `localStorage` (expuesto a XSS); passport-jwt (más configuración que express-jwt para el mismo resultado).

### 9. Autorización (RBAC) centralizada en servicios
- Tras express-jwt, un middleware carga el usuario desde la BD en cada solicitud y usa su **rol vigente** (no el del token), lo que cumple el escenario de degradación de rol durante la sesión.
- Las rutas de administración pasan por un middleware `requireRol('admin')`, y además cada servicio verifica el permiso antes de operar (defensa en profundidad, como pide el enunciado).
- Los accesos denegados se registran en el log con usuario, ruta y motivo.
- El primer administrador se crea con `npm run seed:admin -w server` (RT-07), a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD` del `.env`; los siguientes se promueven desde el panel (HU-23).

### 10. Validación con Validator.js
- **Validator.js** (recomendado por el enunciado) valida y sanea cadenas (`isEmail`, `isStrongPassword`, `isDate`, `isDecimal`, `isIn`, `isMongoId`, `trim`, `normalizeEmail`…), pero no valida objetos completos. Por eso `shared/` define un pequeño validador propio: cada esquema es un objeto `campo → reglas` (obligatorio, tipo, función de Validator.js, mensaje en español) y una función `validar(esquema, datos)` devuelve los datos saneados o la lista de errores `{ campo, mensaje }`.
- El servidor aplica los esquemas con un middleware que traduce los errores al formato de `contrato-api`; el cliente reutiliza los mismos esquemas en los formularios, así los mensajes son idénticos en ambos lados.
- Validator.js solo trabaja con texto: los valores no textuales (números de query, booleanos) se convierten a cadena antes de validar y se convierten al tipo final después.
- Los límites de cada campo están en "Reglas de validación comunes" (sección 25); los esquemas de `shared/` son su única implementación.
- *Alternativa descartada*: Zod o Joi. Validan objetos de forma nativa, pero el equipo prefirió seguir la recomendación del enunciado.

### 11. Contrato de la API y manejo de errores
- Prefijo `/api/v1`; formato `{ data, meta }` / `{ error: { code, message, details } }`; paginación `page`/`limit`; filtros por query (ver spec `contrato-api`).
- Errores de dominio como clases (`ValidationError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError`) capturados por un manejador central que también traduce errores de Mongoose (duplicado → 409, `CastError` → 404).
- Seguridad HTTP con **helmet**; **cors** solo para el origen de `CLIENT_URL` con credenciales; logging estructurado con **pino**.

### 12. Correo: Nodemailer + Brevo (SMTP gratuito)
- Nodemailer con credenciales SMTP desde `.env`. Proveedor sugerido: **Brevo** (300 correos/día gratis, permite enviar a cualquier destinatario verificando solo el remitente, sin dominio propio). Cambiar a Gmail u otro es solo cambiar variables.
- Si `SMTP_HOST` no está definido (desarrollo sin cuenta), los correos se escriben en el log en lugar de enviarse. En pruebas se usa un transporte simulado.
- *Alternativa descartada*: Resend, porque su capa gratuita exige dominio verificado para enviar a terceros.

### 13. Reportes en el servidor con jsPDF y SheetJS
- Endpoints `GET /api/v1/reportes/movimientos.pdf` y `.xlsx` que reciben los mismos filtros que el historial y responden el archivo con `Content-Disposition: attachment`.
- **jsPDF** (+ jspdf-autotable para tablas) y **SheetJS** se usan en Node, cumpliendo tanto la recomendación de librerías del enunciado como la decisión de generar en el servidor.
- SheetJS se instala desde su CDN oficial (`https://cdn.sheetjs.com/`), no desde el paquete `xlsx` de npm, que está desactualizado y tiene vulnerabilidades conocidas.
- Cada reporte admite hasta 5000 movimientos; por encima responde 400 con el mensaje de HU-16 y HU-31. El cliente descarga con `fetch` y muestra un indicador de carga.
- El PDF contiene resumen de indicadores por moneda y tabla de movimientos, sin gráficos. El Excel contiene las hojas de movimientos y "Resumen".

### 14. Frontend: React + Vite
- El aspecto visual sigue `DESIGN.md` (mundo "La libreta de ahorros"); los tokens se definen en el tema de Tailwind y se aplican también a SweetAlert2, react-toastify y Chart.js (RT-05).
- React con **React Router** (rutas protegidas por sesión y rol), estado global con **Context** (sesión del usuario y preferencias como la moneda seleccionada), **Tailwind CSS** para estilos responsivos.
- Librerías del enunciado: **Chart.js** vía react-chartjs-2, **Day.js** para fechas, **SweetAlert2** para confirmaciones, **react-toastify** para notificaciones.
- Un único cliente HTTP (`fetch` con `credentials: 'include'`) que maneja el formato de errores y la renovación automática de sesión.

### 15. Frontend: Screaming Architecture con componentes, hooks y router
El frontend usa **Screaming Architecture** (decisión del equipo, solo para el frontend): la estructura de carpetas "grita" el dominio de la aplicación, no el framework. Al abrir `src/` se ven las funcionalidades del negocio:

```
client/src/
  autenticacion/         # registro, inicio de sesión, recuperación de contraseña
  categorias/
  cuentas/
  movimientos/           # registro, edición, historial y filtros
  dashboard/             # indicadores y gráficos
  presupuestos/
  reportes/
  administracion/        # consulta de usuarios y gestión de roles
    components/          # diseño: componentes de presentación
    hooks/               # lógica de negocio y estado del dominio
    services/            # llamadas a la API del dominio
    pages/               # páginas que unen hooks y componentes
    index.js             # API pública del dominio (lo que otros dominios pueden importar)
  router/                # definición de rutas, rutas protegidas por sesión y por rol
  shared/                # transversal, sin lógica de un dominio concreto
    components/          # UI reutilizable (botones, inputs, tarjetas, tablas, layout)
    hooks/               # hooks genéricos (paginación, filtros en la URL, debounce)
    context/             # sesión del usuario y preferencias (moneda seleccionada)
    api/                 # cliente HTTP
    utils/               # formato de montos y fechas (Day.js), notificaciones
  App.jsx, main.jsx
```

- **Separación de lógica y diseño**: los componentes de `components/` son de presentación. Reciben datos y callbacks por props, no llaman a la API ni contienen reglas de negocio. Toda la lógica (estado, validación con los esquemas de `shared`, llamadas a `services/`, cálculo de valores derivados, manejo de errores y notificaciones) vive en **hooks** del dominio (`useMovimientos`, `useRegistrarMovimiento`, `usePresupuestoMensual`). Las páginas solo conectan un hook con los componentes.
- **Router**: todas las rutas se declaran en `router/` con React Router; las páginas de cada dominio se importan desde su `index.js`. Las rutas privadas exigen sesión y las de `administracion/` además el rol administrador.
- **Dependencias entre carpetas**: un dominio solo importa de `shared/` o del `index.js` de otro dominio, nunca de sus archivos internos; `shared/` no importa de ningún dominio.
- *Alternativa descartada*: organizar por tipo técnico (`src/components/`, `src/hooks/`, `src/pages/` globales). Es más común en React, pero esconde el dominio y mezcla los archivos de todas las funcionalidades.

### 16. Fechas
- `fecha` del movimiento representa un día calendario: se guarda como `Date` a las 00:00 UTC de ese día y se intercambia como `YYYY-MM-DD`, evitando desfases por zona horaria. Los períodos mensuales usan `YYYY-MM`. Zona horaria de referencia para "mes en curso": `APP_TIMEZONE` (por defecto `America/Lima`).

### 17. Calidad: lint, formato y pruebas
- **ESLint** (flat config, con reglas de React en `client/`) y **Prettier** en la raíz.
- Servidor: **Jest** + **Supertest** + **mongodb-memory-server** (replica set en memoria). Jest corre en modo ES Modules (`NODE_OPTIONS=--experimental-vm-modules`).
- Cliente: **Vitest** + React Testing Library + jsdom.
- Cada escenario de las specs se traza a al menos una prueba automatizada. No se exige un porcentaje mínimo de cobertura.

### 18. Configuración, entorno y preparación para despliegue
- Variables en `server/.env` y `client/.env`, con `server/.env.example` y `client/.env.example` versionados; todo `.env` está en `.gitignore`. El servidor valida sus variables al arrancar (con los mismos esquemas de validación) y falla con un mensaje claro si falta alguna.
- Variables del servidor: `NODE_ENV`, `PORT`, `MONGODB_URI`, `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `REFRESH_INACTIVITY_MIN`, `REFRESH_ABSOLUTE_DAYS`, `RESET_TOKEN_TTL_MIN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `APP_TIMEZONE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_PASSWORD` (opcional). Cliente: `VITE_API_URL`.
- Local: `MONGODB_URI=mongodb://localhost:27017/finanzas?replicaSet=rs0`. Atlas: basta con reemplazar la URI por `mongodb+srv://...`.
- Despliegue futuro: el servidor sirve con `npm start -w server` y el cliente se compila con `npm run build -w client` (salida estática). No se crean archivos de proveedor hasta decidir dónde desplegar.

### 19. Protección de ramas en GitHub
- `main` y `dev` exigen pull request y la verificación de integración continua para recibir cambios, sin push directo ni force push ni borrado. Se exige 0 aprobaciones para que el equipo pueda fusionar sus propios PR (se puede subir a 1 cuando haya revisión cruzada).
- El flujo de `CLAUDE.md` pasa de "merge local en `dev`" a "PR hacia `dev`".

### 20. Presupuestos y alertas
- Un presupuesto de categoría exige un presupuesto general del mismo mes y moneda, y la suma de categorías no puede superarlo; ambas reglas se validan en el servicio dentro de una transacción.
- Al crear o editar un gasto, el servicio compara el porcentaje anterior y el nuevo de cada presupuesto afectado. Si cruza 90 % o 100 %, la respuesta incluye `alertas` y el cliente muestra una notificación. Así el aviso aparece una sola vez sin guardar estado adicional; el indicador sigue visible en el dashboard.

### 21. Integración continua
- GitHub Actions (`.github/workflows/ci.yml`) se ejecuta en cada pull request hacia `dev` y `main`: `npm ci`, `npm run lint`, `npm test` y `npm run build` con Node.js 22. No usa secretos: las pruebas emplean MongoDB en memoria y correo simulado.
- El job se llama `verificar` y es la comprobación obligatoria en la protección de ramas.

### 22. Publicación por épica
- Las ramas de trabajo se fusionan en `dev` por pull request. Cuando todas las historias de una épica están terminadas, un pull request lleva `dev` a `main` y se crea la etiqueta indicada en `docs/trazabilidad.md`. Las épicas se implementan una a la vez para que `dev` no lleve trabajo parcial a `main`.

### 23. Datos de demostración
- `server/scripts/seed.js` implementa RT-06 y RT-07. Crea datos deterministas por usuario, sin usar los repositorios porque es una herramienta de carga, y comprueba al final que cada saldo coincide con sus movimientos.
- Solo reemplaza usuarios del dominio `demo.finanzas.test`. Se niega a cargar datos demo en producción o en una base remota salvo `--permitir-remoto`.

### 24. Trazabilidad
- `docs/trazabilidad.md` asigna cada historia a una spec, un cambio de OpenSpec y una rama. Cada tarea y cada commit de código citan su historia (`feat(hu-08): ...`).

### 25. Decisiones confirmadas y reglas de validación

Completan las historias sin modificar su texto. Si una historia original es más general, se aplica esta precisión.

**Decisiones confirmadas**

- Alcance: se mantienen los requisitos (a) a (l) del enunciado y las historias HU-01 a HU-17 tal como las redactó el equipo. HU-09 forma parte del proyecto y las historias HU-18 a HU-31 cubren las necesidades del usuario que faltaban. Lo que solo sirve al desarrollo (base del proyecto, contrato de la API, integración continua, interfaz, datos de demostración y primer administrador) no es una historia: se registra como requisitos técnicos RT-01 a RT-07 en las specs y en `docs/trazabilidad.md`.
- Base de datos: se usa MongoDB en lugar de la mención a SQLite del enunciado; en desarrollo es local y puede cambiarse a MongoDB Atlas modificando la URI de conexión.
- Sesión: expira tras 30 minutos sin actividad, se renueva mientras exista actividad y tiene un máximo de 7 días. El enlace de recuperación de contraseña dura 30 minutos.
- Administrador: consulta los datos de los usuarios en modo de solo lectura y gestiona roles. No crea, edita ni elimina datos financieros ajenos.
- Categorías: no existen categorías globales. Cada usuario recibe categorías predeterminadas propias al registrarse.
- Monedas: se admiten PEN, USD y EUR. Cada cuenta tiene una moneda, sus movimientos la heredan y los totales nunca mezclan monedas ni aplican conversiones.
- Saldo: se actualiza con cada movimiento y debe coincidir siempre con saldo inicial + ingresos − gastos.
- Presupuestos: se definen por mes y moneda para el mes actual o futuros. Los de categoría requieren un presupuesto general y su suma no puede superarlo.
- Alertas de presupuesto: se avisa una sola vez cuando un gasto cruza el 90 % y cuando cruza el 100 %; el indicador permanece visible.
- Reportes: el PDF contiene resumen de indicadores y tabla de movimientos, sin gráficos, y cada reporte admite como máximo 5000 movimientos.
- Prioridad: el campo "Prioridad" se mantiene como buena práctica de gestión del backlog, aunque no forma parte del formato obligatorio de la guía.

**Reglas de validación comunes**

- Nombre de usuario: obligatorio, de 2 a 80 caracteres.
- Correo electrónico: formato válido, sin distinguir mayúsculas y único en el sistema.
- Contraseña: de 8 a 72 caracteres, con al menos una mayúscula y un número.
- Nombre de cuenta o categoría: obligatorio, de 2 a 50 caracteres y único por usuario (por tipo en categorías), sin distinguir mayúsculas.
- Montos de movimientos y presupuestos: mayores a 0, con hasta 2 decimales y máximo 999,999,999.99.
- Saldo inicial: puede ser cero o negativo, con hasta 2 decimales y valor absoluto máximo 999,999,999.99.
- Fecha del movimiento: obligatoria, en formato YYYY-MM-DD, no futura según la zona horaria America/Lima.
- Descripción del movimiento: opcional, de hasta 255 caracteres.
- Moneda: PEN, USD o EUR. Período de presupuesto: formato YYYY-MM.
- Toda validación se aplica antes de guardar; el formulario avisa los errores antes de enviar.

## Risks / Trade-offs

- [El servicio MongoDB local no es replica set y las transacciones fallan] → Tarea de configuración documentada (agregar `replication.replSetName: rs0` a `mongod.cfg`, reiniciar el servicio y ejecutar `rs.initiate()` desde la consola mongosh de Compass); el servidor detecta al arrancar si no hay replica set y muestra cómo corregirlo.
- [Cookies `sameSite=lax` no viajan si en producción cliente y API quedan en dominios distintos] → Al desplegar, servir ambos bajo el mismo dominio (o subdominios con proxy) o cambiar a `sameSite=none` + protección CSRF; se decide al elegir proveedor.
- [Consultar el usuario en BD en cada solicitud agrega latencia] → Es una consulta por `_id` indexada; aceptable para el volumen del proyecto y necesaria para revalidar el rol.
- [Recalcular el saldo en cada movimiento es una agregación extra] → Usa el índice `(tenantId, cuentaId)`; aceptable para volúmenes personales.
- [Sin conversión de monedas, el usuario no ve un patrimonio total consolidado] → Fuera de alcance; el dashboard deja claro en qué moneda muestra los datos.
- [Generar PDF grandes en el servidor bloquea el hilo de Node] → Límite de 5000 movimientos por reporte.
- [Plugin de guardia de `tenantId` puede romper consultas legítimas sin inquilino (p. ej. `usuarios`)] → Solo se aplica a los modelos de datos financieros.

## Migration Plan

No hay datos ni código previos. Orden de trabajo:
1. Proteger ramas y aplicar este cambio en `chore/configurar-proyecto-base` (estructura, tooling, configuración, middlewares transversales, MongoDB como replica set).
2. Archivar el cambio para sincronizar las specs principales.
3. Implementar historias en cambios separados empezando por autenticación (HU-01, HU-02, HU-03) y control de acceso (HU-04, HU-05), de las que dependen todas las demás.
