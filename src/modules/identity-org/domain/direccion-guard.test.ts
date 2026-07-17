import { describe, expect, it } from "vitest";

import { leavesOrgWithoutDireccion } from "./direccion-guard";
import type { Role } from "./roles";

/**
 * F.2 — cobertura de tabla del invariante "la org nunca queda sin Dirección".
 * Test-alongside sobre código existente (la integración ya lo cubría e2e).
 */
describe("direccion-guard", () => {
  const cases: Array<{
    current: Role;
    next: Role;
    direccionCount: number;
    blocked: boolean;
  }> = [
    // Democión de la última Dirección: bloqueada.
    { current: "Direccion", next: "Colaborador", direccionCount: 1, blocked: true },
    { current: "Direccion", next: "Lider", direccionCount: 1, blocked: true },
    // Con otra Dirección presente: permitida.
    { current: "Direccion", next: "Colaborador", direccionCount: 2, blocked: false },
    { current: "Direccion", next: "Lider", direccionCount: 2, blocked: false },
    // No-op de rol Dirección → Dirección: permitida aunque sea la última.
    { current: "Direccion", next: "Direccion", direccionCount: 1, blocked: false },
    // Cambios que no tocan una Dirección: siempre permitidos.
    { current: "Lider", next: "Colaborador", direccionCount: 1, blocked: false },
    { current: "Colaborador", next: "Lider", direccionCount: 1, blocked: false },
    // Promoción a Dirección: permitida.
    { current: "Colaborador", next: "Direccion", direccionCount: 1, blocked: false },
    // Borde defensivo: count 0 (estado inválido) bloquea la democión igual.
    { current: "Direccion", next: "Colaborador", direccionCount: 0, blocked: true },
  ];

  it.each(cases)(
    "$current → $next con $direccionCount Dirección(es) ⇒ blocked=$blocked",
    ({ current, next, direccionCount, blocked }) => {
      expect(leavesOrgWithoutDireccion(current, next, direccionCount)).toBe(blocked);
    },
  );
});
