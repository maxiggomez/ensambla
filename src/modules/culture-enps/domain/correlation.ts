import type { Measurement } from "../../../shared/measurement";

type IntegerMeasurement = Extract<Measurement, { type: "integer" }>;
type PercentageMeasurement = Extract<Measurement, { type: "percentage" }>;

export type OperationalSignal =
  | { type: "over_capacity"; capacity: PercentageMeasurement }
  | { type: "overdue_retro"; overdue: boolean };

export interface EnpsOverCapacityCorrelation {
  type: "enps_drop_with_over_capacity";
  relationship: "coincidence";
  enpsChange: IntegerMeasurement;
  capacity: PercentageMeasurement;
}

export interface EnpsOverdueRetroCorrelation {
  type: "enps_drop_with_overdue_retro";
  relationship: "coincidence";
  enpsChange: IntegerMeasurement;
  overdueRetro: boolean;
}

export type EnpsOperationalCorrelation =
  EnpsOverCapacityCorrelation | EnpsOverdueRetroCorrelation;

function enpsChange(current: number): IntegerMeasurement {
  return { type: "integer", start: -200, target: 0, current };
}

export function correlateTeamEnps(input: {
  previous: IntegerMeasurement;
  current: IntegerMeasurement;
  signals: OperationalSignal[];
}): EnpsOperationalCorrelation[] {
  const change = input.current.current - input.previous.current;
  if (change >= 0) {
    return [];
  }

  return input.signals.flatMap((signal): EnpsOperationalCorrelation[] => {
    if (signal.type === "over_capacity" && signal.capacity.current > 100) {
      return [
        {
          type: "enps_drop_with_over_capacity",
          relationship: "coincidence",
          enpsChange: enpsChange(change),
          capacity: signal.capacity,
        },
      ];
    }
    if (signal.type === "overdue_retro" && signal.overdue) {
      return [
        {
          type: "enps_drop_with_overdue_retro",
          relationship: "coincidence",
          enpsChange: enpsChange(change),
          overdueRetro: true,
        },
      ];
    }
    return [];
  });
}
