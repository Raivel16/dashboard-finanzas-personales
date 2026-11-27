# Tasks

> Alcance: implementa HU-32 y HU-33 completas (ver `proposal.md` y la spec `preferencias-usuario`) en la rama `feature/implementar-preferencias`. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [x] 1.1 Crear la rama `feature/implementar-preferencias` desde un `dev` actualizado y verificar con `git branch --show-current`
- [x] 1.2 Crear en `shared/` el catálogo `MENSAJES_EN`, los nombres en inglés de las categorías predeterminadas y `crearTraductor`; verificar con pruebas de forma del catálogo y de traducción de textos fijos y de plantillas

## 2. Servidor [HU-32, HU-33]

- [x] 2.1 Agregar `idioma`, `textoGrande` y `altoContraste` al usuario, a `/auth/me` y a `PATCH /perfil/preferencias`, y `idioma` al registro con categorías predeterminadas en ese idioma; verificar con pruebas
- [x] 2.2 Resolver `req.idioma` y traducir los errores, advertencias y alertas de la API; verificar con la prueba "Mensajes de error en el idioma elegido" (incluido el idioma del navegador sin sesión)
- [x] 2.3 Traducir los correos y los reportes PDF y Excel; verificar con la prueba "Correos y reportes en el idioma elegido"

## 3. Cliente: idioma [HU-32]

- [x] 3.1 Crear el almacén de idioma, `useT`, el diccionario de pantallas y el envío de `Accept-Language`; pasar todos los textos de las pantallas por `t`; verificar con la prueba de diccionario completo
- [x] 3.2 Agregar el selector de idioma al perfil y a las pantallas públicas; verificar con pruebas "Cambio del idioma a inglés", "Idioma antes de iniciar sesión" y "Mensajes de error en el idioma elegido"

## 4. Cliente: accesibilidad [HU-33]

- [x] 4.1 Agregar las preferencias "Texto grande" y "Alto contraste" al perfil y aplicarlas en toda la aplicación; verificar con la prueba "Texto grande y alto contraste" y el cálculo de contraste de los tokens
- [x] 4.2 Agregar `axe-core` y verificar las pantallas principales, el recorrido con teclado y el anuncio de errores; verificar con pruebas "Registro de un movimiento solo con teclado", "Errores anunciados al lector de pantalla" y "Gráficos y pantallas sin barreras"

## 5. Documentación e integración [RT-01]

- [x] 5.1 Documentar el idioma y la accesibilidad en el README, actualizar `docs/cobertura-escenarios.md` con los 8 escenarios nuevos y verificar que `npm run lint`, `npm test` y `npm run build` pasan
