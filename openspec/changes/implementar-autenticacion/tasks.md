# Tasks

> Alcance: implementa HU-01, HU-02, HU-03, HU-18 y HU-19 (20 escenarios de `autenticacion-usuarios`) en la rama `feature/implementar-autenticacion`. No cambia requisitos. Cada grupo incluye sus propias pruebas; los tiempos se prueban con un reloj inyectable, sin esperas reales.

## 1. Preparación [RT-01]

- [x] 1.1 Crear la rama `feature/implementar-autenticacion` desde un `dev` actualizado y verificar con `git branch --show-current`
- [x] 1.2 Agregar `jsonwebtoken` a `server/package.json` y `SESSION_REVOKED` y `TOKEN_INVALID` a `CODIGOS_ERROR` y a los mensajes de `shared/`; verificar con `npm install` y `npm test -w shared`
- [x] 1.3 Agregar un reloj inyectable (`reloj.ahora()`) y utilidades de tokens (hash SHA-256, token aleatorio base64url, firma y lectura de JWT) en `server/src/utils/`; verificar con pruebas unitarias de cada utilidad

## 2. Modelos y repositorios de identidad [HU-01, HU-02, HU-19]

- [x] 2.1 Crear los modelos `usuario`, `sesion` y `token-recuperacion` con los campos e índices del diseño (`email` y `tenantId` únicos, TTL en `expiraAbsoluta` y `expiraEn`, `tokenHashAnterior` y `rotadoEn`); verificar con una prueba que comprueba que los índices existen y que un correo duplicado se rechaza
- [x] 2.2 Crear `usuario.repository.js`, `sesion.repository.js` y `token-recuperacion.repository.js` (únicos accesos a esos modelos), incluidas las operaciones atómicas de intentos fallidos y de rotación; verificar con pruebas contra `MongoMemoryReplSet`, incluidas dos solicitudes simultáneas que no burlan el contador

## 3. Registro [HU-01]

- [x] 3.1 Implementar `auth.service` (registrar), el controlador, la vista que no expone `passwordHash` y `POST /api/v1/auth/registro` con validación por `esquemaRegistro`; verificar el escenario "Registro exitoso con datos válidos" (rol `usuario`, contraseña cifrada con bcrypt, `tenantId` generado)
- [x] 3.2 Enviar el correo de bienvenida tras guardar sin que un fallo de SMTP deshaga el registro; verificar el escenario "Creación exitosa de identificadores y aislamiento de datos" con el transporte simulado y una prueba donde el transporte falla
- [x] 3.3 Traducir el correo duplicado (incluido el caso simultáneo) a 409 "Este correo ya se encuentra registrado" y verificar los escenarios "Registro rechazado por correo ya registrado" y "Registro rechazado por contraseña insegura"

## 4. Inicio de sesión y autenticación [HU-02, HU-19]

- [x] 4.1 Implementar `iniciarSesion` con bcrypt, bloqueo atómico de 3 intentos y 5 minutos, mensaje único "Credenciales inválidas" y comparación con hash falso para correo inexistente; verificar los escenarios "Inicio de sesión exitoso", "Bloqueo temporal por credenciales incorrectas" (con reloj movido 5 minutos) y que usuario inexistente e inactivo responden igual
- [x] 4.2 Crear la sesión al iniciar y emitir las cookies `access_token` y `refresh_token` con las opciones del diseño; verificar atributos `httpOnly`, `sameSite`, `path` y que en BD solo hay el hash del token de renovación
- [x] 4.3 Crear el middleware `autenticar` (verificación del JWT de la cookie con `jsonwebtoken` y el reloj inyectado, carga del usuario y de la sesión en paralelo, rol vigente, extensión de actividad limitada a una escritura por minuto) y `GET /api/v1/auth/me`; verificar 401 `TOKEN_EXPIRED`, `SESSION_EXPIRED`, `SESSION_REVOKED` y que un administrador devuelve `rol: admin` (parte del escenario "Acceso ampliado para un administrador")
- [x] 4.4 Agregar `Cache-Control: no-store` a las rutas de autenticación y autenticadas; verificar la cabecera en pruebas
- [x] 4.5 Implementar `POST /api/v1/auth/refresh` con rotación, ventana de gracia de 10 segundos, detección de reutilización y tope absoluto de 7 días; verificar "Sesión renovada mientras el usuario está activo", "Regreso después de una pausa corta" (20 minutos), "Límite máximo de la sesión" (7 días) y "Sesión invalidada por expiración del token" (31 minutos), todos con reloj movido

## 5. Cierre de sesión [HU-18]

- [x] 5.1 Implementar `POST /api/v1/auth/logout` que revoca solo la sesión actual y borra las cookies, y responde sin error aunque la sesión ya haya expirado; verificar "Cierre de sesión exitoso", "Otras sesiones permanecen activas" y "Cierre de sesión con la sesión ya expirada"
- [x] 5.2 Verificar "Regreso a una página tras cerrar sesión": con el token de acceso anterior la API responde 401 `SESSION_REVOKED` y no entrega datos

## 6. Recuperación de contraseña [HU-03, HU-19]

- [x] 6.1 Implementar `POST /api/v1/auth/olvide-contrasena` con respuesta genérica, envío sin esperar, límite de 60 segundos y token de 32 bytes con su hash y vencimiento de 30 minutos; verificar "Solicitud exitosa de recuperación de contraseña" y "Solicitud procesada sin revelar existencia de la cuenta" (mismo cuerpo y código para correo existente y no existente)
- [x] 6.2 Implementar `POST /api/v1/auth/restablecer-contrasena` (token de un solo uso, nueva contraseña cifrada, revocación de todas las sesiones, reinicio del bloqueo, aviso por correo); verificar "Restablecimiento exitoso mediante enlace válido", "Enlace de recuperación expirado" (reloj +31 minutos) y que un token reutilizado se rechaza
- [x] 6.3 Verificar "Sesión cerrada desde otro dispositivo": tras restablecer, la sesión previa recibe 401 `SESSION_REVOKED` con el mensaje "Tu sesión se cerró, por favor inicia sesión nuevamente"

## 7. Cliente: sesión y cliente HTTP [HU-02, HU-18, HU-19]

- [ ] 7.1 Agregar a `clienteHttp` la configuración `configurarSesionHttp` con renovación única compartida y un solo reintento ante `TOKEN_EXPIRED`; verificar con pruebas de Vitest: dos solicitudes simultáneas provocan una sola renovación y una renovación fallida no reintenta en bucle
- [ ] 7.2 Crear el dominio `autenticacion/` con servicio, `ProveedorSesion`, `useSesion`, `RutaProtegida` y `RutaPublica`, exportados por su `index.js`; verificar con pruebas que una ruta protegida sin sesión redirige a `/iniciar-sesion` y que `npm run lint` no reporta fronteras rotas
- [ ] 7.3 Mostrar en el inicio de sesión los mensajes "Tu sesión ha expirado, por favor inicia sesión nuevamente" y "Tu sesión se cerró, por favor inicia sesión nuevamente" según el código recibido; verificar con pruebas que simulan cada código
- [ ] 7.4 Agregar a `AppLayout` la ranura `menuUsuario` y los destinos `soloAdmin`, con el botón "Cerrar sesión" que limpia el estado en memoria y lleva a `/iniciar-sesion`; verificar que un administrador ve los destinos `soloAdmin` y un usuario estándar no, y que tras cerrar sesión "Atrás" no muestra datos

## 8. Cliente: pantallas [HU-01, HU-02, HU-03]

- [ ] 8.1 Crear el layout público y la pantalla de registro con `useFormulario` y `esquemaRegistro`; verificar con pruebas el éxito (redirige a inicio de sesión con mensaje de confirmación), el correo duplicado y la contraseña insegura con el campo resaltado y el mensaje exacto de la spec
- [ ] 8.2 Crear la pantalla de inicio de sesión; verificar con pruebas el éxito, "Credenciales inválidas" y el aviso de bloqueo de 5 minutos con el botón deshabilitado hasta que pase
- [ ] 8.3 Crear las pantallas "¿Olvidaste tu contraseña?" y de restablecimiento (el token se lee de la URL y se quita de la barra con `history.replaceState`); verificar el mensaje genérico, el restablecimiento exitoso y el enlace expirado con la opción de pedir uno nuevo
- [ ] 8.4 Registrar las rutas `/registro`, `/iniciar-sesion`, `/olvide-contrasena` y `/restablecer-contrasena` en `router/` y proteger el resto; verificar con el router de memoria y comprobar en el navegador el flujo completo en celular y escritorio

## 9. Documentación e integración [RT-01]

- [ ] 9.1 Documentar en el README los endpoints de autenticación, las cookies, los tiempos y el aviso de Gmail/spam, y actualizar `docs/trazabilidad.md`; verificar que cada comando documentado se ejecuta
- [ ] 9.2 Ejecutar `npm run lint`, `npm test` y `npm run build`, y probar a mano con `npm run dev` y los usuarios demo: registro, inicio de sesión, bloqueo, recuperación (enlace en el log) y cierre de sesión; verificar que los 20 escenarios tienen una prueba que pasa
- [ ] 9.3 Ejecutar `openspec validate implementar-autenticacion --strict` y verificar que el cambio es válido

## Workflow follow-up

- Abrir un pull request de `feature/implementar-autenticacion` hacia `dev` con el job `verificar` en verde.
- Archivar el cambio con `openspec-archive-change` tras fusionarlo.
- Continuar con `implementar-perfil` (HU-20, HU-21) y, al completar la épica 1, abrir el pull request de `dev` hacia `main` y etiquetar `v0.2.0`.
