import type { TradeCaseStage } from './trade-case-stage';
import type { TradeCaseActivityStatus } from './trade-case-activity-status';
import type { BusinessPriority } from './business-priority';
import type { HealthStatus, RiskLevel } from './trade-case-health';
import type { TradeCaseProgress, StageProgress } from './trade-case-progress';
import type { NextAction } from './next-action';
import type { DeadlineCollection } from './deadline-monitor';

/**
 * Immutable snapshot of the computed state for a trade case.
 *
 * This snapshot is produced once by the TradeCaseStateSnapshotBuilder and then
 * consumed by all business rules. It centralizes all derived values so that
 * rules never recalculate remaining balances, stage, health, risk, progress,
 * deadlines, or next action.
 */
export interface TradeCaseStateSnapshot {
  /** Registration status string (e.g. "ACTIVE", "COMPLETED", "BLOCKED"). */
  readonly registrationStatus: string;

  /** Current operational stage of the trade case. */
  readonly currentStage: TradeCaseStage;

  /** Context-aware activity status derived from registrationStatus. */
  readonly activityStatus: TradeCaseActivityStatus;

  /** Computed business priority based on remaining obligations and urgency. */
  readonly businessPriority: BusinessPriority;

  /** Health status (HEALTHY, NEEDS_ATTENTION, CRITICAL). */
  readonly health: HealthStatus;

  /** Risk level (LOW, MEDIUM, HIGH, CRITICAL). */
  readonly risk: RiskLevel;

  /** Progress percentages (overall and per-stage). */
  readonly progress: TradeCaseProgress;

  /** Remaining allocation amount. */
  readonly remainingAllocation: number;

  /** Remaining origin amount. */
  readonly remainingOrigin: number;

  /** Remaining declaration amount. */
  readonly remainingDeclaration: number;

  /** Remaining commitment amount. */
  readonly remainingCommitment: number;

  /** Deadline monitoring results. */
  readonly deadlines: DeadlineCollection;

  /** The next required action for the trade case. */
  readonly nextAction: NextAction;
}

export default TradeCaseStateSnapshot;