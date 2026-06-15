/**
 * Estimated consultation fees per concern, shown to the patient BEFORE they
 * confirm a request (workflow spec: "initial invoice displayed before confirming").
 * These are estimates; the admin sets the actual initial invoice on approval.
 * Pure data + lookup — no DB, no React (unit-testable).
 */
import type { Concern } from '../types';

/** Estimated initial fee (PHP) per concern. */
const CONCERN_FEES: Record<Concern, number> = {
  checkup: 800,
  tooth_pain: 1000,
  broken_tooth: 1500,
  gum_problem: 1200,
  whitening: 3500,
  braces: 5000,
  tooth_removal: 2000,
  child_visit: 700,
  follow_up: 500,
  not_sure: 800,
};

/** Fallback used when a concern isn't in the table (defensive). */
export const DEFAULT_FEE = 800;

/** Estimated fee for a concern, or the default fallback. */
export function estimateFee(concern: Concern | '' | null | undefined): number {
  if (!concern) return DEFAULT_FEE;
  return CONCERN_FEES[concern] ?? DEFAULT_FEE;
}
