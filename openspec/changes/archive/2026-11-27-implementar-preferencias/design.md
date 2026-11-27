# Design

## Contexto

Todos los textos están en español: en `shared/src/mensajes.js` (mensajes compartidos por cliente y servidor, incluidos los de validación), escritos directamente en los componentes del cliente, en las plantillas de correo y en la vista de reportes. Los servicios del servidor lanzan errores con el texto en español. La base visual (RT-05) ya cubre foco al primer error, panel con Escape y tablas equivalentes de los gráficos.

## Decisiones

### 1. El español es la fuente y se traduce por texto
No se reescriben los servicios para que lancen claves. `shared/src/i18n/` define el catálogo `MENSAJES_EN` con **la misma forma** que `MENSAJES` (una prueba lo exige) y `crearTraductor(diccionarios)`, que arma un mapa español → inglés recorriendo ambos árboles en paralelo:
- los textos fijos se traducen por búsqueda exacta;
- los mensajes que son funciones (por ejemplo `supera(5000)` o `requerido('nombre')`) se convierten en una expresión regular llamando a la función con marcadores; los valores capturados también se traducen (así una etiqueta como "nombre" pasa a "name");
- un texto sin traducción se devuelve tal cual, nunca vacío.
El cliente agrega su propio diccionario con los textos de las pantallas (`client/src/shared/i18n/textos.en.js`). Una prueba recorre el código del cliente y exige que cada texto pasado a `t('…')` tenga traducción.

### 2. Preferencias en el usuario
El modelo de usuario gana `idioma` (`es` | `en`, por defecto `es`), `textoGrande` y `altoContraste` (booleanos, por defecto `false`). Viajan en `/auth/me` y se cambian con `PATCH /perfil/preferencias` (ruta propia: `PATCH /perfil` exige el nombre y cambiar el idioma no debe obligar a reenviarlo). El registro acepta `idioma` y crea las categorías predeterminadas en ese idioma (los nombres en inglés están en el catálogo).

### 3. Idioma de cada respuesta de la API
`req.idioma` es el idioma del usuario autenticado o, sin sesión, el del encabezado `Accept-Language` (inglés si empieza por `en`, si no español). El middleware de errores traduce `message` y cada `details[].mensaje`; los controladores traducen `meta.advertencias` y `meta.alertas`. Los correos (bienvenida, recuperación, contraseña actualizada) y los reportes reciben el idioma de la persona destinataria.

### 4. Idioma en el cliente
Un almacén pequeño (`useSyncExternalStore`) guarda el idioma actual. Su valor inicial sale de `localStorage` y, si no hay, del idioma del navegador. Al cargar la sesión se toma el del usuario. `useT()` devuelve `t` para el idioma vigente, así que cambiarlo vuelve a pintar todo sin recargar ni perder el estado. Cada cambio actualiza `document.documentElement.lang` (para que el lector pronuncie bien) y el cliente HTTP envía `Accept-Language`. El selector está en el perfil y en el pie de las pantallas públicas.

### 5. Texto grande y alto contraste
Se aplican como atributos en `<html>`: `data-texto="grande"` sube el tamaño base (todo el diseño usa `rem`, así que escala completo) y `data-contraste="alto"` redefine los tokens de color de `index.css` con pares que cumplen al menos 7:1. Sin sesión se recuerdan en `localStorage`; con sesión vienen del perfil.

### 6. Verificación de accesibilidad
Se agrega `axe-core` como dependencia de desarrollo del cliente y una ayuda de prueba que falla si una pantalla tiene infracciones (jsdom no calcula colores, así que el contraste se comprueba aparte con el cálculo de WCAG sobre los tokens). Se recorre con teclado el registro de un movimiento y se verifica el estilo de foco visible.

## Riesgos
- Un texto nuevo sin traducción: lo detecta la prueba del diccionario del cliente y la de forma de `MENSAJES_EN`.
- Traducción por texto ambigua si dos mensajes españoles iguales necesitaran traducciones distintas: no ocurre hoy y la prueba de forma lo haría visible.
