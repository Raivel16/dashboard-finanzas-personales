# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

MERN con JavaScript: React + Vite + Tailwind CSS en el cliente, Express + MongoDB en el servidor. Detalle en `openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md`.

## Users

Personas adultas hispanohablantes que quieren ordenar sus finanzas personales o del hogar. Manejan dinero en efectivo, cuentas bancarias, tarjetas de crédito y billeteras digitales, a veces en más de una moneda. No se asume formación financiera.

También existe el rol administrador, que consulta en modo de solo lectura los datos de los usuarios y gestiona sus roles.

## Product Purpose

Permitir registrar, organizar, visualizar y analizar ingresos y gastos para identificar hábitos de consumo, controlar el presupuesto y decidir mejor. El éxito es que la persona registre un movimiento en segundos y entienda de un vistazo cuánto entró, cuánto salió y cuánto le queda del presupuesto.

## Positioning

Una herramienta personal de control financiero cuyas cifras siempre cuadran: el saldo de cada cuenta coincide con sus movimientos y nunca se mezclan monedas distintas en un mismo total.

## Operating Context

- Registro rápido desde el celular, justo después de gastar o recibir dinero.
- Revisión y análisis en computadora: dashboard, historial, presupuestos y reportes PDF o Excel.
- Ambos contextos tienen la misma prioridad.

## Capabilities and Constraints

- Las capacidades y reglas están en `docs/historias-de-usuario.md` y `openspec/specs/`.
- Interfaz en español.
- Librerías fijadas por el enunciado del curso: Chart.js, Day.js, SweetAlert2, Toastify.
- Sin conversión entre monedas.
- Los datos de cada usuario están aislados; el producto está preparado para evolucionar a SaaS multiinquilino.

## Brand Commitments

- Nombre de trabajo: Dashboard de Finanzas Personales. No existe logo ni identidad previa.
- Voz cercana y clara, de tú, sin regañar a la persona por cómo gasta.

## Evidence on Hand

No hay usuarios, testimonios ni métricas reales. Los datos de demostración son sintéticos y no deben presentarse como reales.

## Product Principles

1. Las cifras son confiables: todo total es explicable a partir de movimientos concretos.
2. Registrar es más rápido que postergar.
3. Lo importante se entiende sin conocimientos financieros.
4. La información financiera de cada persona es privada.
5. Informar, no juzgar: las alertas ayudan a decidir y no culpan.

## Accessibility & Inclusion

Objetivo WCAG 2.2 AA: contraste suficiente, uso completo con teclado, foco visible, y estados como ingreso, gasto o alerta comunicados también con texto o signo, nunca solo con color.
