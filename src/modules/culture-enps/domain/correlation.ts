import type { Measurement } from "../../../shared/measurement";

type IntegerMeasurement = Extract<Measurement, { type: "integer" }>;
type PercentageMeasurement = Extract<Measurement, { type: "percentage" }>;

export type OperationalSignal = {
  type: "over_capacity";
  capacity: PercentageMeasurement;
};

export interface EnpsCapacityCorrelation {
  type: "enps_drop_with_over_capacity";
  relationship: "coincidence";
  enpsChange: IntegerMeasurement;
  capacity: PercentageMeasurement;
}

export function correlateTeamEnps(input: {
  previous: IntegerMeasurement;
  current: IntegerMeasurement;
  signals: OperationalSignal[];
}): EnpsCapacityCorrelation[] {
  const change = input.current.current - input.previous.current;
  if (change >= 0) {
    return [];
  }

  return input.signals.flatMap((signal) =>
    signal.type === "over_capacity" && signal.capacity.current > 100
      ? [
          {
            type: "enps_drop_with_over_capacity" as const,
            relationship: "coincidence" as const,
            enpsChange: {
              type: "integer" as const,
              start: -200,
              target: 0,
              current: change,
            },
            capacity: signal.capacity,
          },
        ]
      : [],
  );
}
