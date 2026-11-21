# Design

## Context

La arquitectura general (MVC en el servidor, Screaming Architecture en el cliente, contrato de la API, correo con Nodemailer) y la sesión con JWT en cookies `httpOnly` ya están decididas en el diseño archivado de `definir-arquitectura-base` (secciones 4, 8, 9, 11 y 12 de `openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md`). Este documento no las repite: fija lo que ese diseño dejó abierto para implementarlas. Los requisitos y escenarios están en `openspec/specs/autenticacion-usuarios/spec.md`; el motivo, en `proposal.md`.

Estado del código del que se parte:

- El servidor tiene `crearApp`, el manejador central de errores, `validarCuerpo`, `RepositorioBase` con el plugin de `tenantId`, el servicio de correo (con transporte inyectable) y los códigos de error de `shared/`. No hay modelos de dominio, rutas de negocio ni autenticación.
- El cliente tiene el cliente HTTP, el layout responsivo, `useFormulario` (con foco en el primer error), `Campo`, `Boton` y el router con las rutas de inicio y catálogo. No hay sesión ni rutas protegidas.
- `shared/` ya define `esquemaRegistro`, `esquemaInicioSesion` y los mensajes de contraseña; el seed ya crea `usuarios` con `intentosFallidos`, `bloqueadoHasta` y `activo`.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-01, HU-02, HU-03, HU-18 y HU-19 tenga una prueba automatizada que pase, con los tiempos (5 minutos, 30 minutos, 7 días) probados sin esperas reales.
- Que la inactividad de 30 minutos se mida desde la actividad real del usuario, no desde la última renovación del token.
- Que ninguna respuesta de la API permita saber si un correo está registrado, salvo en el registro, donde la spec lo exige expresamente.

**Non-Goals:**

- Perfil, cambio de contraseña, categorías predeterminadas, "Administración" y gestión de roles (ver `proposal.md`).
- Verificación del correo, inicio de sesión social, doble factor y límite de solicitudes por IP: no están en las historias.
- Lista de dispositivos con sesión abierta: HU-18 solo pide que cerrar una sesión no afecte a las otras.

## Decisions

### 1. Las colecciones de identidad no usan `RepositorioBase`

`usuarios`, `sesiones` y `tokensrecuperacion` se consultan por `email`, `tokenHash` o `usuarioId` antes de que exista un `tenantId` autenticado (para iniciar sesión hay que encontrar al usuario primero). Por eso no pasan por `RepositorioBase` ni por el plugin de `tenantId`, que rechaza consultas sin él. Tendrán repositorios propios (`usuario.repository.js`, `sesion.repository.js`, `token-recuperacion.repository.js`) y siguen siendo la única capa que toca sus modelos. Los datos financieros no cambian: siguen obligados a filtrar por `tenantId`. *Alternativa descartada*: relajar el plugin con una opción "global", porque debilita justo la protección que más importa.

### 2. La inactividad se mide en la sesión, y el token de acceso apunta a ella

El token de acceso (15 minutos) lleva `sub`, `tenantId`, `rol` y `sid` (el id de la sesión). El middleware `autenticar`, que ya lee al usuario de la BD en cada solicitud para usar su rol vigente (diseño 9), lee también la sesión en paralelo y:

- rechaza con 401 `SESSION_REVOKED` si la sesión fue revocada (cierre de sesión, restablecimiento o cambio de contraseña): así el cierre de sesión surte efecto de inmediato y no solo cuando vence el token;
- rechaza con 401 `SESSION_EXPIRED` si pasó `expiraInactividad` o `expiraAbsoluta`;
- si no, extiende `expiraInactividad` a "ahora + 30 minutos" (`ultimaActividad`), escribiendo como máximo una vez por minuto para no añadir una escritura a cada solicitud.

Con esto "pausa corta de 20 minutos" y "actividad con intervalos menores a 30 minutos" cumplen la spec aunque el token de acceso dure 15. *Alternativa descartada*: medir la inactividad solo en la renovación; falla cuando el usuario trabaja a los 14 minutos y vuelve a los 31, porque el servidor solo vería una renovación a los 0 y otra a los 31.

### 3. Renovación con rotación y una ventana de gracia de 10 segundos

`POST /auth/refresh` valida el token de renovación (cookie, ruta `/api/v1/auth`) por su hash SHA-256, emite un nuevo par y rota el valor. Si llega un token ya rotado hace menos de 10 segundos (`tokenHashAnterior`, `rotadoEn`), solo se emite un nuevo token de acceso sin volver a rotar; pasada la ventana, se interpreta como robo y se revoca la sesión. La ventana evita cerrar la sesión de un usuario legítimo con dos pestañas que renuevan a la vez. En el cliente, las renovaciones de una misma pestaña comparten una sola promesa. *Alternativa descartada*: sin ventana; más simple, pero cierra sesiones por una carrera normal.

### 4. Bloqueo por intentos con mensajes que no distinguen casos

Se usa el diseño 8 (`intentosFallidos`, `bloqueadoHasta` en el usuario). Precisiones:

- Correo inexistente y contraseña incorrecta responden igual (401 "Credenciales inválidas"); con correo inexistente se compara contra un hash falso para igualar el tiempo de respuesta y no revelar la cuenta.
- El tercer fallo consecutivo bloquea 5 minutos y responde 429; mientras dura el bloqueo, incluso la contraseña correcta recibe 429 con los minutos restantes.
- El contador se actualiza con una operación atómica de MongoDB (`$inc` y, al llegar a 3, `$set` de `bloqueadoHasta`), no leyendo y escribiendo, para que solicitudes simultáneas no burlen el límite. El inicio de sesión correcto lo reinicia.
- Un usuario con `activo: false` recibe el mismo "Credenciales inválidas".

### 5. Recuperación de contraseña

- El enlace es `CLIENT_URL/restablecer-contrasena?token=<valor>`; el valor es de 32 bytes aleatorios en base64url y en BD solo se guarda su hash. El cliente lo envía en el cuerpo del `POST`, nunca en la URL de la API.
- `POST /auth/olvide-contrasena` responde siempre 200 con el mensaje genérico de la spec. El envío del correo no se espera (se registra el fallo en el log), para que el tiempo de respuesta no delate si la cuenta existe.
- Si ya existe un token vigente creado hace menos de 60 segundos para ese usuario, no se emite otro: evita usar la función para inundar de correos a una persona, sin rechazar la solicitud ni revelar nada.
- Un token nuevo invalida los anteriores del usuario. Restablecer marca el token como usado, guarda la nueva contraseña, revoca **todas** las sesiones y reinicia el bloqueo por intentos.
- Token vencido, usado o desconocido responden igual (400 `TOKEN_INVALID`, "El enlace ha expirado"), y la pantalla ofrece pedir uno nuevo.

### 6. Registro

Crea el usuario con `tenantId` (UUID v4) generado en el servicio, rol `usuario` y `monedaPrincipal` `PEN`, normaliza el correo a minúsculas y se apoya en el índice único para el caso de dos registros simultáneos (el error de clave duplicada se traduce a 409 "Este correo ya se encuentra registrado"). El correo de bienvenida se envía después de guardar y un fallo de SMTP no deshace el registro. Las categorías predeterminadas las agrega `implementar-categorias` dentro de este mismo flujo, en una transacción, cuando exista el modelo de categorías.

### 7. Cookies, caché y CSRF

`access_token` (ruta `/`, 15 minutos) y `refresh_token` (ruta `/api/v1/auth`, hasta el tope absoluto), ambas `httpOnly`, `sameSite=lax` y `secure` en producción. Las rutas de `/api/v1/auth` y todas las autenticadas responden con `Cache-Control: no-store`, para que "Atrás" tras cerrar sesión no recupere datos del caché del navegador (HU-18). Las rutas que cambian estado solo aceptan JSON, y `sameSite=lax` más el CORS restringido a `CLIENT_URL` cubren el CSRF sin un token adicional.

### 8. Cliente: sesión en el dominio `autenticacion/`, sin que `shared/` lo conozca

- `shared/api/clienteHttp.js` no puede importar el dominio, así que expone `configurarSesionHttp({ renovar, alSesionTerminada })`. El dominio lo configura al montar el proveedor. Ante un 401 `TOKEN_EXPIRED`, el cliente llama a `renovar` (una sola promesa compartida) y reintenta la solicitud una vez; ante `SESSION_EXPIRED` o `SESSION_REVOKED`, llama a `alSesionTerminada(codigo)`.
- `autenticacion/` exporta por su `index.js` el `ProveedorSesion`, el hook `useSesion`, `RutaProtegida`, `RutaPublica` y las páginas. El proveedor carga la sesión con `GET /auth/me` al iniciar y guarda en memoria el usuario (`nombre`, `email`, `rol`, `monedaPrincipal`); no guarda tokens, que viven solo en cookies.
- `RutaProtegida` redirige a `/iniciar-sesion` y muestra el mensaje que corresponda (sesión expirada o cerrada); `RutaPublica` envía al dashboard a quien ya tiene sesión. Al cerrar sesión se limpia el estado en memoria, así "Atrás" no muestra datos.
- `AppLayout` recibe una ranura `menuUsuario` (nombre y "Cerrar sesión") y destinos con la marca `soloAdmin`, que filtra según el rol. El router los arma; `shared/` sigue sin conocer el dominio. La sección "Administración" y sus páginas llegan en `implementar-control-acceso`: aquí se prueba que un administrador ve los destinos `soloAdmin` y que un usuario estándar no.
- Las pantallas públicas usan un layout propio, sin barra lateral, y los formularios reutilizan `useFormulario` y los esquemas de `shared/`, de modo que los mensajes del cliente y del servidor son idénticos.

### 9. Pruebas

Los servicios reciben un reloj inyectable (`reloj.ahora()`) y un transporte de correo simulado, por lo que las pruebas de expiración (5 minutos, 30 minutos, 7 días) mueven el reloj en lugar de esperar. Las pruebas del servidor usan `supertest` contra la aplicación completa con `MongoMemoryReplSet`, y las del cliente simulan `fetch` con Vitest y Testing Library. Cada escenario de las cinco historias tiene al menos una prueba con el texto del escenario en su nombre.

## Risks / Trade-offs

- [Una lectura más de BD por solicitud (la sesión)] → Se ejecuta en paralelo con la del usuario y usa índice por `_id`; la escritura de actividad se limita a una por minuto.
- [Dos pestañas renuevan a la vez y una pierde la sesión] → Ventana de gracia de 10 segundos y promesa compartida por pestaña (decisión 3).
- [Un atacante bloquea a un usuario fallando su contraseña a propósito] → Es el comportamiento que pide HU-02; el bloqueo dura solo 5 minutos y no revela si la cuenta existe.
- [Gmail como remitente puede caer en spam] → Se avisa en el README; los correos de desarrollo se pueden leer en el log sin SMTP.
- [El enlace de recuperación queda en la URL del navegador] → Se usa de un solo uso y con 30 minutos; Helmet envía `Referrer-Policy: no-referrer`, y el cliente lo quita de la barra con `history.replaceState` al leerlo.
- [Sin límite por IP, el registro y el inicio de sesión admiten abuso automatizado] → Está fuera del alcance de las historias; el bloqueo por cuenta y el límite de correos de recuperación cubren lo más sensible y se puede añadir después sin cambiar el contrato.

## Migration Plan

No hay datos que migrar: las colecciones son nuevas y el seed ya crea usuarios con la forma definida. Se despliega con el siguiente `dev`; para volver atrás basta revertir el pull request, porque ningún otro módulo depende aún de la sesión. Tras fusionar, quien tenga datos demo de antes puede volver a ejecutar `npm run seed -w server`.
