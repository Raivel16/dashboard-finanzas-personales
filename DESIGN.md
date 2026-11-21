<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Dashboard de Finanzas Personales
description: Control de ingresos, gastos y presupuestos con la confianza de una libreta de ahorros donde todo cuadra.
---

# Design System: Dashboard de Finanzas Personales

## Overview

**Creative North Star: "La libreta de ahorros"**

La aplicación toma de la libreta bancaria su idea central: cada operación queda asentada en una línea y al lado se ve el saldo que dejó. Quien la usa no necesita saber de finanzas para comprobar que las cifras cuadran, porque el recorrido del dinero se puede leer de arriba abajo.

La libreta presta solo cuatro cosas: tipografía, color, densidad y un gesto propio. La navegación, los formularios, las tablas y los diálogos son los controles web de siempre. La pantalla nunca imita papel rayado, costuras ni tapas de cuero; se reconoce primero como una aplicación de finanzas y después como una libreta.

**El gesto propio: la línea asentada.** Toda lista de movimientos muestra, junto al monto, el saldo de la cuenta tras ese movimiento. Al registrar uno, su fila entra resaltada con un sello violeta de "Asentado" y el saldo final se actualiza sobre una doble línea, la marca contable del total.

**Key Characteristics:**
- Cifras en tipografía monoespaciada, alineadas por el punto decimal.
- Barra de navegación en azul petróleo, como la tapa de la libreta, sobre un fondo de papel de seguridad.
- Violeta de sello reservado para la acción principal y la confirmación.
- Separación por filetes finos en lugar de sombras y tarjetas flotantes.
- Densidad cómoda: se leen muchas filas sin que el texto sea pequeño.

## Colors

Estrategia con color comprometido en el armazón: la tapa y el papel dan identidad, y el resto del color cumple una función concreta. Los valores están implementados como tokens de Tailwind (`@theme` en `client/src/index.css`) y espejados para Chart.js y SweetAlert2 en `client/src/shared/utils/tokens.js`; una prueba comprueba que coinciden. Contrastes de texto comprobados en AA.

### Primary
- **Azul petróleo de tapa** (#123F4A): barra lateral, navegación inferior móvil y encabezados de sección fuertes.
- **Texto sobre tapa** (#F4F8F6) y **texto secundario sobre tapa** (#B9D0CF): etiquetas e íconos de la navegación.

### Secondary
- **Violeta de sello** (#54399E): botón principal, enlace activo, foco, selección y sello "Asentado".

### Neutral
- **Papel de seguridad** (#EDF3F0): fondo general de la aplicación.
- **Hoja** (#F9FBFA): superficies de tablas, formularios y gráficos.
- **Tinta** (#14262E): texto principal y cifras.
- **Tinta suave** (#4F626B): etiquetas, ayudas y encabezados de columna.
- **Filete** (#C9D6D2): divisiones entre filas y bordes de controles decorativos. 
- **Borde de campo** (#7A8C86): borde de inputs, con contraste 3,41:1 frente a la hoja.
- **Violeta de sello oscuro** (#43297F): estado hover del botón principal.

### Estados
- **Ingreso** (#0A6B55, fondo #DDF1EA): montos positivos, siempre con signo `+`.
- **Gasto y error** (#A62E26, fondo #FBE6E2): montos negativos con signo `−`, presupuesto excedido y errores.
- **Atención** (#7A4F00, fondo #FBEFCB): presupuesto en el umbral del 90 %.

### Gráficos
Validados con la herramienta de visualización sobre la hoja (#F9FBFA).
- **Serie de ingresos** (#00897B) y **serie de gastos** (#C8551F): pasan todas las comprobaciones, incluida la separación para daltonismo.
- **Categorías, en orden fijo:** #0B7F9E, #CC7A10, #6A4FC0, #3FA34D, #D1477A, #8A8F12, #2F6FE0, #B5562C. La novena categoría en adelante se agrupa en "Otras".

### Named Rules
**La regla del sello.** El violeta significa "actúa aquí" o "quedó asentado". No se usa para decorar ni como serie de un gráfico.

**La regla del signo.** Ingreso, gasto y alerta nunca dependen solo del color: llevan signo, ícono o texto.

**La regla de la moneda.** Todo total muestra su código o símbolo de moneda. Dos monedas jamás comparten una misma cifra, barra o gráfico.

## Typography

**Body Font:** Public Sans (con system-ui, sans-serif)
**Label/Mono Font:** IBM Plex Mono (con ui-monospace, monospace)

**Character:** Una sans pública, sobria y muy legible para la interfaz, junto a una monoespaciada de herencia impresa que da a las cifras el aire de una línea asentada.

### Hierarchy
- **Saldo destacado** (Plex Mono 500, 2.25rem en escritorio y 1.875rem en móvil, 1.1): saldo o balance principal de una pantalla. Uno por vista.
- **Headline** (Public Sans 650, 1.5rem, 1.25): título de la página.
- **Title** (Public Sans 600, 1.125rem, 1.35): título de sección, tarjeta o gráfico.
- **Body** (Public Sans 400, 1rem, 1.5): texto y formularios; máximo 70 caracteres por línea.
- **Cifra de tabla** (Plex Mono 400, 0.9375rem, 1.4, alineada a la derecha): montos y saldos.
- **Label** (Public Sans 500, 0.8125rem, 1.35): etiquetas de campo y encabezados de columna, sin mayúsculas sostenidas.

### Named Rules
**La regla del decimal.** Toda columna de montos usa dos decimales y alineación a la derecha, para que los puntos queden uno debajo del otro.

## Layout

Diseño móvil primero con los cortes estándar de Tailwind (640, 768, 1024 y 1280 px) y ritmo de espaciado sobre una base de 4 px.

- **Desde 1024 px:** barra lateral fija de 232 px y contenido con ancho máximo de 1280 px.
- **Menos de 1024 px:** barra superior con la página actual y navegación inferior de cinco destinos: Inicio, Movimientos, Registrar, Presupuestos y Más.
- **Registrar un movimiento:** en móvil se abre a pantalla completa desde el botón central, con el monto primero y teclado numérico; en escritorio, en un panel lateral que no saca a la persona del historial.
- **Tablas en móvil:** cada movimiento pasa a una fila de dos niveles: descripción y monto arriba; categoría, cuenta y saldo resultante abajo.
- **Dashboard:** saldo destacado e indicadores arriba; gráficos debajo, en dos columnas desde 1024 px y en una en móvil.
- Áreas táctiles de al menos 44 × 44 px.

## Elevation & Depth

Plano por defecto. La profundidad se construye con el cambio de papel a hoja y con filetes de 1 px. Solo lo que realmente flota sobre la página (diálogos, menús y notificaciones) lleva una sombra corta y discreta.

### Named Rules
**La regla de la hoja plana.** Una superficie en reposo no tiene sombra. Si necesita separarse, usa un filete.

## Shapes

Esquinas contenidas: 4 px en controles y 8 px en superficies y diálogos. El único círculo con carácter es el sello "Asentado". La doble línea de 1 px sobre un total es la forma recurrente del sistema.

## Do's and Don'ts

### Do:
- **Do** mostrar el saldo resultante en cada fila de movimientos, y una doble línea sobre el saldo o total final.
- **Do** resolver en cada vista los estados de carga, vacío, error y sin resultados, con el texto definido en las historias de usuario.
- **Do** aplicar estos colores y esquinas a SweetAlert2, Toastify y Chart.js para que no parezcan piezas ajenas.
- **Do** acompañar los gráficos con leyenda y dar acceso a los mismos datos como tabla.
- **Do** limitar el movimiento a 120–200 ms y respetar `prefers-reduced-motion`: el sello aparece sin animación.
- **Do** mantener el foco visible con un contorno violeta de 2 px.

### Don't:
- **Don't** imitar papel, renglones, costuras, cuero o tipografía de máquina en toda la interfaz.
- **Don't** usar el violeta de sello como color decorativo.
- **Don't** comunicar ingreso, gasto o alerta solo con color.
- **Don't** sumar ni graficar juntas cantidades de monedas distintas.
- **Don't** usar lenguaje que juzgue la forma de gastar.
