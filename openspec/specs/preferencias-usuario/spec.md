# preferencias-usuario Specification

## Purpose
Permitir que cada persona use la aplicación en su idioma (español o inglés) y de forma accesible, con teclado, lector de pantalla, texto grande y alto contraste.

Épica de origen: Preferencias y Accesibilidad (HU-32, HU-33).

## Requirements

### Requirement: Elegir el idioma de la aplicación
El sistema SHALL permitir que el usuario elija entre español e inglés y SHALL mostrar en ese idioma las pantallas, los mensajes, los correos y los reportes, sin traducir los datos que el propio usuario registró.

Origen: HU-32 (ver `docs/historias-de-usuario.md`).

#### Scenario: Cambio del idioma a inglés
- **GIVEN** el usuario usa la aplicación en español
- **WHEN** elige "English" como idioma en su perfil
- **THEN** toda la interfaz se muestra en inglés de inmediato, sin recargar la página, y el idioma se conserva al volver a iniciar sesión

#### Scenario: Idioma antes de iniciar sesión
- **GIVEN** un visitante sin sesión usa un navegador configurado en inglés
- **WHEN** abre la pantalla de inicio de sesión
- **THEN** la ve en inglés y puede cambiar a español desde el selector de idioma de esa misma pantalla

#### Scenario: Mensajes de error en el idioma elegido
- **GIVEN** el usuario usa la aplicación en inglés
- **WHEN** intenta registrar un movimiento con monto 0
- **THEN** el sistema rechaza el registro y muestra el mensaje de validación en inglés "The amount must be greater than 0, with up to 2 decimals"

#### Scenario: Correos y reportes en el idioma elegido
- **GIVEN** el usuario eligió inglés como idioma
- **WHEN** solicita la recuperación de su contraseña o exporta un reporte en PDF o Excel
- **THEN** el correo y el archivo (títulos, columnas y totales) están en inglés, y los nombres que él mismo registró (categorías, cuentas y descripciones) se mantienen tal como los escribió

### Requirement: Usar la aplicación de forma accesible
El sistema SHALL poder usarse por completo con teclado y lector de pantalla y SHALL permitir activar texto grande y alto contraste como preferencias guardadas del usuario, tomando WCAG 2.1 nivel AA como referencia.

Origen: HU-33 (ver `docs/historias-de-usuario.md`).

#### Scenario: Registro de un movimiento solo con teclado
- **GIVEN** el usuario navega únicamente con el teclado
- **WHEN** recorre el menú, abre el formulario de un nuevo movimiento, lo completa y lo registra
- **THEN** completa toda la operación con Tab, Enter y Escape, el foco es siempre visible y, al cerrar el panel, vuelve al botón que lo abrió

#### Scenario: Texto grande y alto contraste
- **GIVEN** el usuario activa "Texto grande" y "Alto contraste" en su perfil
- **WHEN** navega por la aplicación
- **THEN** todas las pantallas usan el texto ampliado y los colores de alto contraste, y las preferencias se conservan al volver a iniciar sesión

#### Scenario: Errores anunciados al lector de pantalla
- **GIVEN** el usuario usa un lector de pantalla
- **WHEN** envía un formulario con datos inválidos
- **THEN** el lector anuncia el error, el campo queda marcado como inválido y asociado a su mensaje, y el foco pasa al primer campo con error

#### Scenario: Gráficos y pantallas sin barreras
- **GIVEN** el usuario usa un lector de pantalla
- **WHEN** abre el dashboard y las demás pantallas principales
- **THEN** cada gráfico ofrece una tabla equivalente con los mismos datos, y las pantallas no presentan infracciones de accesibilidad detectables automáticamente (WCAG 2.1 nivel AA)
