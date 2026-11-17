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
- Implementar las historias de usuario (cada una tendrá su propio cambio).
- Conversión entre monedas o tipos de cambio.
- Despliegue real (solo se deja preparado).
- Familias o inquilinos con varios usuarios: hoy cada usuario es su propio inquilino; el modelo solo deja la puerta abierta.

## Decisions

### 1. Monorepo con npm workspaces: `client/`, `server/`, `shared/`
Un solo repositorio con `package.json` raíz que declara los workspaces y scripts comunes (`dev`, `test`, `lint`, `format`). `shared/` contiene los esquemas de validación (basados en Validator.js), constantes (roles, tipos de movimiento, tipos de cuenta, monedas soportadas) y mensajes de error en español, usados por cliente y servidor para que las validaciones y mensajes de las specs sean idénticos en ambos lados (DRY).
- Todo en **JavaScript con ES Modules** (`"type": "module"`), sin TypeScript (decisión del equipo).
- Node.js 22 LTS, fijado en `.nvmrc` y `engines`.
- *Alternativa descartada*: dos repositorios separados. Complica compartir validaciones y coordinar cambios que tocan API y UI a la vez.

### 2. Backend: Express 5 por módulos con capas Controller–Service–Repository
```
server/src/
  app.js                 # arma la app Express (middlewares, rutas, manejador de errores)
  server.js              # conecta a MongoDB y levanta el servidor
  config/                # lectura y validación de variables de entorno
  middlewares/           # autenticación, autorización por rol, validación, errores
  modules/<modulo>/      # auth, usuarios, categorias, cuentas, movimientos,
                         # presupuestos, dashboard, reportes, admin
    <modulo>.routes.js
    <modulo>.controller.js   # HTTP: lee la solicitud, llama al servicio, responde
    <modulo>.service.js      # reglas de negocio y autorización
    <modulo>.repository.js   # único acceso a Mongoose, siempre filtrado por tenantId
    <modulo>.model.js
  shared/ (errores, logger, utilidades de dinero y fechas)
```
- Los controladores no acceden a modelos; los servicios no conocen `req`/`res`; solo los repositorios usan Mongoose.
- Nombres de dominio en español (`movimiento`, `cuenta`, `presupuesto`); sufijos de capa y términos técnicos genéricos en inglés.
- *Alternativa descartada*: organizar por capa (`controllers/`, `services/`…). Por módulo mantiene junto todo lo de una historia y facilita que cada cambio OpenSpec toque una carpeta.

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
- Dashboard, presupuestos y reportes siempre agregan filtrando o agrupando por moneda. `monedaPrincipal` del usuario (por defecto `PEN`, elegible en el registro) define la moneda inicial del dashboard.

### 7. Saldo de cuenta consistente con transacciones
- Crear, editar o eliminar un movimiento se hace en una **transacción de MongoDB** que guarda el movimiento y ajusta `saldoActual` de las cuentas afectadas con `$inc`.
- Dentro de la misma transacción se recalcula el saldo esperado (`saldoInicial + Σ ingresos − Σ gastos`, por agregación) y, si difiere del almacenado, se corrige y se registra un aviso en el log (ver spec `gestion-cuentas`). Además se expone un script `npm run verificar-saldos -w server` para revisar todas las cuentas.
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
- El primer administrador se crea con un script de seed (`npm run seed:admin -w server`) a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD` del `.env`; los siguientes se promueven desde el panel.

### 10. Validación con Validator.js
- **Validator.js** (recomendado por el enunciado) valida y sanea cadenas (`isEmail`, `isStrongPassword`, `isDate`, `isDecimal`, `isIn`, `isMongoId`, `trim`, `normalizeEmail`…), pero no valida objetos completos. Por eso `shared/` define un pequeño validador propio: cada esquema es un objeto `campo → reglas` (obligatorio, tipo, función de Validator.js, mensaje en español) y una función `validar(esquema, datos)` devuelve los datos saneados o la lista de errores `{ campo, mensaje }`.
- El servidor aplica los esquemas con un middleware que traduce los errores al formato de `contrato-api`; el cliente reutiliza los mismos esquemas en los formularios, así los mensajes son idénticos en ambos lados.
- Validator.js solo trabaja con texto: los valores no textuales (números de query, booleanos) se convierten a cadena antes de validar y se convierten al tipo final después.
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
- Para volúmenes grandes la descarga se hace por `fetch` con indicador de carga en el cliente; si se vuelve lento se evaluará generar en segundo plano (no se implementa ahora, YAGNI).

### 14. Frontend: React + Vite
- React con **React Router** (rutas protegidas por sesión y rol), estado global con **Context** (sesión del usuario y preferencias como la moneda seleccionada), **Tailwind CSS** para estilos responsivos.
- Librerías del enunciado: **Chart.js** vía react-chartjs-2, **Day.js** para fechas, **SweetAlert2** para confirmaciones, **react-toastify** para notificaciones.
- Un único cliente HTTP (`fetch` con `credentials: 'include'`) que maneja el formato de errores y la renovación automática de sesión.
- Estructura por funcionalidad: `client/src/features/<modulo>/` con páginas, componentes y llamadas a la API; `client/src/components/` para componentes comunes.

### 15. Fechas
- `fecha` del movimiento representa un día calendario: se guarda como `Date` a las 00:00 UTC de ese día y se intercambia como `YYYY-MM-DD`, evitando desfases por zona horaria. Los períodos mensuales usan `YYYY-MM`. Zona horaria de referencia para "mes en curso": `APP_TIMEZONE` (por defecto `America/Lima`).

### 16. Calidad: lint, formato y pruebas
- **ESLint** (flat config, con reglas de React en `client/`) y **Prettier** en la raíz.
- Servidor: **Jest** + **Supertest** + **mongodb-memory-server** (replica set en memoria). Jest corre en modo ES Modules (`NODE_OPTIONS=--experimental-vm-modules`).
- Cliente: **Vitest** + React Testing Library + jsdom.
- Cada escenario de las specs debería poder trazarse a al menos una prueba.

### 17. Configuración, entorno y preparación para despliegue
- Variables en `server/.env` y `client/.env`, con `server/.env.example` y `client/.env.example` versionados; todo `.env` está en `.gitignore`. El servidor valida sus variables al arrancar (con los mismos esquemas de validación) y falla con un mensaje claro si falta alguna.
- Variables del servidor: `NODE_ENV`, `PORT`, `MONGODB_URI`, `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `REFRESH_INACTIVITY_MIN`, `REFRESH_ABSOLUTE_DAYS`, `RESET_TOKEN_TTL_MIN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `APP_TIMEZONE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Cliente: `VITE_API_URL`.
- Local: `MONGODB_URI=mongodb://localhost:27017/finanzas?replicaSet=rs0`. Atlas: basta con reemplazar la URI por `mongodb+srv://...`.
- Despliegue futuro: el servidor sirve con `npm start -w server` y el cliente se compila con `npm run build -w client` (salida estática). No se crean archivos de proveedor hasta decidir dónde desplegar.

### 18. Protección de ramas en GitHub
- `main` y `dev` exigen pull request para recibir cambios, sin push directo ni force push ni borrado. Se exige 0 aprobaciones para que el equipo pueda fusionar sus propios PR (se puede subir a 1 cuando haya revisión cruzada).
- El flujo de `CLAUDE.md` pasa de "merge local en `dev`" a "PR hacia `dev`".

## Risks / Trade-offs

- [El servicio MongoDB local no es replica set y las transacciones fallan] → Tarea de configuración documentada (agregar `replication.replSetName: rs0` a `mongod.cfg`, reiniciar el servicio y ejecutar `rs.initiate()` desde la consola mongosh de Compass); el servidor detecta al arrancar si no hay replica set y muestra cómo corregirlo.
- [Cookies `sameSite=lax` no viajan si en producción cliente y API quedan en dominios distintos] → Al desplegar, servir ambos bajo el mismo dominio (o subdominios con proxy) o cambiar a `sameSite=none` + protección CSRF; se decide al elegir proveedor.
- [Consultar el usuario en BD en cada solicitud agrega latencia] → Es una consulta por `_id` indexada; aceptable para el volumen del proyecto y necesaria para revalidar el rol.
- [Recalcular el saldo en cada movimiento es una agregación extra] → Usa el índice `(tenantId, cuentaId)`; aceptable para volúmenes personales.
- [Sin conversión de monedas, el usuario no ve un patrimonio total consolidado] → Fuera de alcance; el dashboard deja claro en qué moneda muestra los datos.
- [Generar PDF grandes en el servidor bloquea el hilo de Node] → Límite de filas por reporte y medición; mover a segundo plano solo si se observa el problema.
- [Plugin de guardia de `tenantId` puede romper consultas legítimas sin inquilino (p. ej. `usuarios`)] → Solo se aplica a los modelos de datos financieros.

## Migration Plan

No hay datos ni código previos. Orden de trabajo:
1. Proteger ramas y aplicar este cambio en `chore/configurar-proyecto-base` (estructura, tooling, configuración, middlewares transversales, MongoDB como replica set).
2. Archivar el cambio para sincronizar las specs principales.
3. Implementar historias en cambios separados empezando por autenticación (HU-01, HU-02, HU-03) y control de acceso (HU-04, HU-05), de las que dependen todas las demás.
