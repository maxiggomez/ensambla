import type { StrategyFormState } from "./actions";

export function FormFeedback({ state }: { state: StrategyFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-sm bg-risk-soft px-3 py-2 text-sm text-risk">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p
        role="status"
        className="rounded-sm bg-brand-soft px-3 py-2 text-sm font-bold text-ink"
      >
        {state.success}
      </p>
    );
  }
  return null;
}
