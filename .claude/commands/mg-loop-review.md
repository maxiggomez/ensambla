---
description: Revisión read-only del branch/diff actual con estado final (APPROVED / COMMENTS / BLOCKED).
argument-hint: [qué revisar; default branch actual vs main]
---

Usá la skill `mg-pr-review` — protocolo read-only de revisión.

Scope: $ARGUMENTS (si está vacío: branch actual contra `main`).

Sos read-only: no edites, no commitees, no corras comandos que muten estado. Emití exactamente un estado final: APPROVED / APPROVED WITH COMMENTS / BLOCKED.
