---
description: Engineering loop de Ensambla (OpenSpec + TDD con plan de tests aprobado + verificación estricta).
agent: build
---

Usá la skill `mg-eng-loop` — fuente única del protocolo (DISCOVER → CAMINO → OpenSpec → PLAN DE TESTS con gate de aprobación → RED → GREEN → REFACTOR → VERIFY → REVIEW → cierre).

Pedido:
$ARGUMENTS

PRE-CHECK de branch primero: si la branch actual es `main`, FRENÁ y pedí al usuario crear una feature branch. Nunca crees ni pushees branches automáticamente.

Respetá los dos gates de usuario sin excepción: elección de camino (paso 2) y aprobación del plan de tests (paso 4). No improvises un flujo distinto.
