# Tasks

> Alcance: implementa HU-20 y HU-21 (8 escenarios de `autenticacion-usuarios`) en la rama `feature/implementar-perfil`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [x] 1.1 Crear la rama `feature/implementar-perfil` desde un `dev` actualizado y verificar con `git branch --show-current`
- [x] 1.2 Agregar a `shared/` los esquemas `esquemaActualizarPerfil` (nombre obligatorio, moneda opcional) y `esquemaCambiarContrasena` (actual obligatoria, nueva segura) y los mensajes de contraseña actual incorrecta y nueva igual a la actual; verificar con pruebas de `shared` (incluido "El nombre es obligatorio" con el nombre vacío)

## 2. Servidor: perfil [HU-20]

- [x] 2.1 Agregar `actualizarPerfil(id, datos)` a `usuarioRepository` y el servicio, controlador, vista y ruta `PATCH /api/v1/perfil` protegida por `autenticar`, que ignora el correo; verificar "Actualización exitosa del nombre", "Cambio de moneda principal" (se guarda y `/auth/me` la devuelve) y "Nombre inválido rechazado" con pruebas de API
- [x] 2.2 Verificar "Correo no editable" en la API: enviar `email` no cambia el correo guardado; y que sin sesión la ruta responde 401

## 3. Servidor: cambio de contraseña [HU-21]

- [x] 3.1 Agregar `revocarOtras(usuarioId, sesionId, ahora)` a `sesionRepository` y `PUT /api/v1/perfil/contrasena` con reserva de intento, comparación de la actual, rechazo de la igual y guardado del hash; verificar "Cambio exitoso de contraseña", "Contraseña actual incorrecta" y "Nueva contraseña igual a la actual" con los mensajes exactos
- [x] 3.2 Revocar las demás sesiones conservando la actual y enviar el aviso por correo sin bloquear la respuesta; verificar "Cierre de las demás sesiones" con dos dispositivos, y que cinco intentos con la actual incorrecta terminan en 429

## 4. Cliente [HU-20, HU-21]

- [ ] 4.1 Exponer `reemplazarUsuario` en el contexto de sesión de `autenticacion/` y crear el dominio `perfil/` (servicio, `usePerfil`, componentes y página "Mi perfil" con correo de solo lectura y la nota "El correo no se puede cambiar"); verificar con pruebas "Actualización exitosa del nombre" (el menú cambia y se notifica), "Cambio de moneda principal", "Nombre inválido" (no llama a la API) y "Correo no editable"
- [ ] 4.2 Agregar el formulario de cambio de contraseña con confirmación (`useCambiarContrasena`); verificar con pruebas el éxito, la contraseña actual incorrecta marcada en su campo, la nueva igual a la actual y la confirmación distinta sin llamar a la API
- [ ] 4.3 Registrar la ruta `/perfil` y el destino "Mi perfil" en `router/`; verificar con el router de memoria y que `npm run lint` no reporta fronteras rotas

## 5. Documentación e integración [RT-01]

- [ ] 5.1 Documentar en el README las rutas de perfil y actualizar `docs/trazabilidad.md` si corresponde; verificar que cada comando documentado se ejecuta
- [ ] 5.2 Ejecutar `npm run lint`, `npm test` y `npm run build`, y probar a mano contra el servidor real el cambio de nombre, de moneda y de contraseña con dos sesiones; verificar que los 8 escenarios tienen una prueba que pasa
- [ ] 5.3 Ejecutar `openspec validate implementar-perfil --strict` y verificar que el cambio es válido

## Workflow follow-up

- Abrir un pull request de `feature/implementar-perfil` hacia `dev` con el job `verificar` en verde.
- Archivar el cambio con `openspec-archive-change` tras fusionarlo.
- Al completar la épica 1, abrir el pull request de `dev` hacia `main` y etiquetar `v0.2.0`.
