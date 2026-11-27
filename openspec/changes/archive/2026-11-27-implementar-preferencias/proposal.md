# Proposal

## Why

La aplicación solo está en español y su accesibilidad se limita a lo que fijó la base visual (RT-05). El equipo incorporó dos historias nuevas en la épica 10 de `docs/historias-de-usuario.md`: HU-32, elegir entre español e inglés para todo lo que la persona ve, y HU-33, usar la aplicación con teclado y lector de pantalla y ajustar el tamaño del texto y el contraste. Se publican como `v0.11.0`.

## What Changes

- **Idioma (HU-32)**: la persona elige español o inglés en su perfil y el cambio se aplica de inmediato, sin recargar. Antes de iniciar sesión el idioma sale del navegador y se puede cambiar desde las pantallas públicas. Se traducen las pantallas, las notificaciones, los mensajes de error de la API, los correos y los reportes PDF y Excel. Los datos que escribió la persona (categorías, cuentas, descripciones) no se traducen; las categorías predeterminadas se crean en el idioma con que se registró.
- **Accesibilidad (HU-33)**: uso completo con teclado y foco visible, errores anunciados al lector de pantalla, preferencias "Texto grande" y "Alto contraste" guardadas en el perfil, tabla equivalente de cada gráfico y pantallas principales sin infracciones de accesibilidad detectables automáticamente (WCAG 2.1 AA).
- Servidor: el usuario guarda `idioma`, `textoGrande` y `altoContraste`; la API responde sus mensajes en el idioma de la persona (o el del navegador si no hay sesión).
- Cliente: catálogo de textos en inglés, selector de idioma, preferencias de accesibilidad y su aplicación global.

## Capabilities

### New Capabilities
- `preferencias-usuario`: idioma de la aplicación y preferencias de accesibilidad de cada persona.

### Modified Capabilities
<!-- Ninguna: los requisitos existentes no cambian. -->

## Impact

- **Servidor**: modelo y vista de usuario, perfil, registro (idioma y categorías predeterminadas), middleware de errores, correos y vista de reportes.
- **Shared**: catálogo de mensajes en inglés con la misma forma que el español y un traductor por texto.
- **Cliente**: todas las pantallas pasan sus textos por el traductor; perfil y pantallas públicas ganan los selectores; estilos de texto grande y alto contraste; pruebas automáticas de accesibilidad con axe-core.
- **Fuera de alcance**: más idiomas, traducir datos escritos por la persona, conversión de formatos numéricos por idioma y un tema oscuro.
- **Trazabilidad**: rama `feature/implementar-preferencias`; HU-32 y HU-33 hechas al fusionar.
