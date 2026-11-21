# Tasks

> Alcance: implementa HU-23 completa y el mecanismo de HU-04, HU-05 y HU-22 (ver `proposal.md`: las partes que dependen de datos financieros se completan en las épicas de datos) en la rama `feature/implementar-control-acceso`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [x] 1.1 Crear la rama `feature/implementar-control-acceso` desde un `dev` actualizado y verificar con `git branch --show-current`
- [x] 1.2 Agregar a `shared/` el esquema `esquemaCambiarRol` (rol entre `ROLES`), `esquemaConsultaUsuarios` (paginación y `q`) y el mensaje "Debe existir al menos un administrador"; verificar con pruebas de `shared`

## 2. Servidor: autorización [HU-04]

- [x] 2.1 Crear el middleware `requerirRol` y `autorizacion.service.js` (`exigirAdmin`) con registro en el log de cada denegación (usuario, ruta, motivo); verificar "Restricción de acceso para usuario estándar" (403 "Acceso no autorizado" por URL directa) y "Operación rechazada por falta de permisos" (el servicio rechaza y se registra el intento)
- [x] 2.2 Verificar "Denegación tras degradación de rol durante una sesión": un administrador degradado recibe 403 en su siguiente solicitud con el mismo token, y uno promovido obtiene acceso en la siguiente

## 3. Servidor: usuarios y roles [HU-22, HU-23]

- [x] 3.1 Agregar `listarUsuarios` (búsqueda por nombre o correo con la cadena escapada, paginación, orden) y `buscarPorId` administrativo a `usuarioRepository`, y el servicio, controlador, vista y rutas `GET /admin/usuarios` y `GET /admin/usuarios/:id`; verificar "Búsqueda de usuarios" (listado paginado, sin hash en la respuesta) y que un usuario estándar recibe 403
- [x] 3.2 Implementar `PATCH /admin/usuarios/:id/rol` con transacción y documento centinela; verificar "Promoción de un usuario a administrador", "Degradación de otro administrador" (pierde el acceso de inmediato) y "Degradación del último administrador rechazada" (409 con el mensaje exacto), y que dos degradaciones simultáneas entre dos administradores no dejan al sistema sin administradores
- [x] 3.3 Agregar `RepositorioLectura` (sin métodos de escritura) y probarlo con un recurso de prueba: el administrador lee los datos de otra persona, no hay forma de escribirlos y el intento de modificarlos por las rutas normales responde 404 con "El recurso solicitado no existe o no tienes permiso para acceder a él" y no cambia nada

## 4. Cliente [HU-04, HU-22, HU-23]

- [x] 4.1 Crear `RutaAdmin` en `autenticacion/` y el dominio `administracion/` (servicio, `useUsuarios`, componentes y página con búsqueda y paginación); verificar con pruebas "Búsqueda de usuarios" y que un usuario estándar no ve la opción y recibe "Acceso no autorizado" por URL directa
- [x] 4.2 Agregar el cambio de rol con confirmación (`useCambioRol`); verificar con pruebas la promoción, la degradación, "Cambio de rol sin confirmar" (no llama a la API y el selector conserva el valor) y el rechazo del último administrador con el mensaje del servidor
- [x] 4.3 Crear el detalle de usuario en solo lectura con las secciones de categorías, cuentas, movimientos y presupuestos en estado vacío ("Este usuario aún no tiene movimientos"), sin opciones de crear, editar ni eliminar; refrescar la sesión al recibir un 403 para ocultar el menú; verificar con pruebas
- [x] 4.4 Registrar las rutas `/administracion` y `/administracion/usuarios/:id` y el destino `soloAdmin` "Administración" en `router/`; verificar con el router de memoria y que `npm run lint` no reporta fronteras rotas

## 5. Documentación e integración [RT-01]

- [x] 5.1 Documentar en el README las rutas de administración y la regla del último administrador, y anotar en `docs/trazabilidad.md` que las épicas de datos deben agregar la lectura de administrador y las pruebas de HU-04, HU-05 y HU-22; verificar que cada comando documentado se ejecuta
- [x] 5.2 Ejecutar `npm run lint`, `npm test` y `npm run build`, y probar a mano contra el servidor real con el administrador del seed: listar, buscar, promover, degradar y el rechazo del último administrador
- [x] 5.3 Ejecutar `openspec validate implementar-control-acceso --strict` y verificar que el cambio es válido

## Workflow follow-up

- Abrir un pull request de `feature/implementar-control-acceso` hacia `dev` con el job `verificar` en verde.
- Archivar el cambio con `openspec-archive-change` tras fusionarlo.
- Al completar la épica 2, abrir el pull request de `dev` hacia `main` y etiquetar `v0.3.0`, anotando que HU-04, HU-05 y HU-22 siguen parciales hasta las épicas de datos.
