import { DomainError } from "../../../shared/errors";

/**
 * Capacity (teams-staffing): el % de una asignación es lo único que se
 * persiste; todo total (capacity de Team, carga de persona) se deriva en
 * lectura y nunca se edita. Overloaded estricto: > 100.
 */

export function capacityPercent(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new DomainError(
      "teams-staffing/invalid-capacity",
      "Capacity percent must be an integer between 0 and 100",
    );
  }
  return value;
}

interface HasCapacity {
  capacityPercent: number;
}

export function teamCapacity(assignments: readonly HasCapacity[]): number {
  return sum(assignments);
}

export function personLoad(assignments: readonly HasCapacity[]): number {
  return sum(assignments);
}

export function isOverloaded(total: number): boolean {
  return total > 100;
}

function sum(assignments: readonly HasCapacity[]): number {
  return assignments.reduce((total, assignment) => total + assignment.capacityPercent, 0);
}
