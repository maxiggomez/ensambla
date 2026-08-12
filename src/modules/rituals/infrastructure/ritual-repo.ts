import type {
  Ritual,
  RitualCadence,
  RitualOccurrence,
  RitualOccurrenceStatus,
  TenantClient,
} from "../../../shared/db";

export type RitualWithOccurrences = Ritual & { occurrences: RitualOccurrence[] };

export interface InsertRitualInput {
  id: string;
  organizationId: string;
  teamId: string;
  name: string;
  cadence: RitualCadence;
  startDate: Date;
}

export async function insertRitual(tx: TenantClient, input: InsertRitualInput): Promise<void> {
  await tx.ritual.create({ data: input });
}

export function findRitualById(tx: TenantClient, id: string): Promise<Ritual | null> {
  return tx.ritual.findUnique({ where: { id } });
}

export async function listRitualsWithOccurrences(
  tx: TenantClient,
): Promise<RitualWithOccurrences[]> {
  const rituals = await tx.ritual.findMany({ orderBy: { createdAt: "asc" } });
  const occurrences = await tx.ritualOccurrence.findMany();
  const occurrencesByRitual = new Map<string, RitualOccurrence[]>();
  for (const occurrence of occurrences) {
    const list = occurrencesByRitual.get(occurrence.ritualId);
    if (list) {
      list.push(occurrence);
    } else {
      occurrencesByRitual.set(occurrence.ritualId, [occurrence]);
    }
  }
  return rituals.map((ritual) => ({
    ...ritual,
    occurrences: occurrencesByRitual.get(ritual.id) ?? [],
  }));
}

export function listOccurrencesByRitual(
  tx: TenantClient,
  ritualId: string,
): Promise<RitualOccurrence[]> {
  return tx.ritualOccurrence.findMany({ where: { ritualId } });
}

export interface InsertOccurrenceInput {
  id: string;
  organizationId: string;
  ritualId: string;
  scheduledDate: Date;
  status: RitualOccurrenceStatus;
}

export async function insertOccurrences(
  tx: TenantClient,
  inputs: readonly InsertOccurrenceInput[],
): Promise<void> {
  if (inputs.length === 0) {
    return;
  }
  // skipDuplicates: la generación es idempotente por UNIQUE (ritual, fecha).
  await tx.ritualOccurrence.createMany({ data: [...inputs], skipDuplicates: true });
}

export function findOccurrenceById(
  tx: TenantClient,
  id: string,
): Promise<RitualOccurrence | null> {
  return tx.ritualOccurrence.findUnique({ where: { id } });
}

export async function updateOccurrenceStatus(
  tx: TenantClient,
  id: string,
  status: RitualOccurrenceStatus,
  heldDate?: Date | null,
): Promise<void> {
  await tx.ritualOccurrence.update({ where: { id }, data: { status, heldDate } });
}
