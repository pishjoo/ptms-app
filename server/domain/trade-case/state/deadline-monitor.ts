import type { TradeCaseStage } from './trade-case-stage';

/**
 * Severity level for a deadline warning.
 */
export type DeadlineSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * Result of a deadline evaluation for a single stage.
 */
export interface DeadlineInfo {
  /** The stage this deadline applies to. */
  readonly stage: TradeCaseStage;

  /** Human-readable label for the deadline type. */
  readonly label: string;

  /** Number of days remaining before the deadline. Negative if past due. */
  readonly daysRemaining: number;

  /** Whether the deadline has passed. */
  readonly isExpired: boolean;

  /** Whether the deadline is approaching (within warning threshold). */
  readonly isWarning: boolean;

  /** Computed severity based on days remaining. */
  readonly severity: DeadlineSeverity;
}

/**
 * Collection of all deadline evaluations for a trade case.
 */
export interface DeadlineCollection {
  /** Registration expiry deadline, if applicable. */
  readonly registrationExpiry?: DeadlineInfo;

  /** Allocation expiry deadline, if applicable. */
  readonly allocationExpiry?: DeadlineInfo;

  /** Origin delay deadline, if applicable. */
  readonly originDelay?: DeadlineInfo;

  /** Declaration delay deadline, if applicable. */
  readonly declarationDelay?: DeadlineInfo;

  /** Commitment delay deadline, if applicable. */
  readonly commitmentDelay?: DeadlineInfo;
}

/**
 * Default deadline thresholds in days.
 * These represent the expected duration for each stage.
 */
export const DEFAULT_DEADLINE_DAYS: Record<Exclude<TradeCaseStage, 'COMPLETED'>, number> = {
  REGISTRATION: 30,
  ALLOCATION: 45,
  ORIGIN: 60,
  DECLARATION: 30,
  COMMITMENT: 45,
};

/**
 * Warning threshold: number of days before expiry to trigger isWarning.
 */
const WARNING_THRESHOLD_DAYS = 14;

/**
 * Compute a single DeadlineInfo for a stage.
 *
 * @param stage - The stage to evaluate.
 * @param label - Human-readable label.
 * @param startDate - The date the stage started (or null if not started).
 * @param allowedDays - Number of days allowed for this stage.
 * @returns A DeadlineInfo object.
 */
export function computeDeadline(
  stage: TradeCaseStage,
  label: string,
  startDate: Date | null,
  allowedDays: number = DEFAULT_DEADLINE_DAYS[stage as Exclude<TradeCaseStage, 'COMPLETED'>] ?? 30,
): DeadlineInfo {
  if (startDate === null) {
    // Stage not yet started — no deadline pressure
    return {
      stage,
      label,
      daysRemaining: allowedDays,
      isExpired: false,
      isWarning: false,
      severity: 'INFO',
    };
  }

  const now = new Date();
  const deadlineDate = new Date(startDate.getTime() + allowedDays * 24 * 60 * 60 * 1000);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;
  const isWarning = !isExpired && daysRemaining <= WARNING_THRESHOLD_DAYS;

  let severity: DeadlineSeverity;
  if (isExpired) {
    severity = 'CRITICAL';
  } else if (isWarning) {
    severity = 'WARNING';
  } else {
    severity = 'INFO';
  }

  return { stage, label, daysRemaining, isExpired, isWarning, severity };
}

/**
 * Evaluate deadlines for a trade case based on available date information
 * for each stage.
 *
 * @param snapshot - Object containing optional start dates per stage.
 * @param overrides - Optional custom allowed days per stage (falls back to defaults).
 * @returns A DeadlineCollection of evaluated deadlines.
 */
export function evaluateDeadlines(
  snapshot: {
    registrationDate?: Date | null;
    allocationDate?: Date | null;
    originDate?: Date | null;
    declarationDate?: Date | null;
    commitmentDate?: Date | null;
  },
  overrides?: Partial<Record<Exclude<TradeCaseStage, 'COMPLETED'>, number>>,
): DeadlineCollection {
  const allowedRegistration = overrides?.REGISTRATION ?? DEFAULT_DEADLINE_DAYS.REGISTRATION;
  const allowedAllocation = overrides?.ALLOCATION ?? DEFAULT_DEADLINE_DAYS.ALLOCATION;
  const allowedOrigin = overrides?.ORIGIN ?? DEFAULT_DEADLINE_DAYS.ORIGIN;
  const allowedDeclaration = overrides?.DECLARATION ?? DEFAULT_DEADLINE_DAYS.DECLARATION;
  const allowedCommitment = overrides?.COMMITMENT ?? DEFAULT_DEADLINE_DAYS.COMMITMENT;

  return {
    registrationExpiry: snapshot.registrationDate !== undefined
      ? computeDeadline('REGISTRATION', 'Registration Expiry', snapshot.registrationDate, allowedRegistration)
      : undefined,
    allocationExpiry: snapshot.allocationDate !== undefined
      ? computeDeadline('ALLOCATION', 'Allocation Expiry', snapshot.allocationDate, allowedAllocation)
      : undefined,
    originDelay: snapshot.originDate !== undefined
      ? computeDeadline('ORIGIN', 'Origin Delay', snapshot.originDate, allowedOrigin)
      : undefined,
    declarationDelay: snapshot.declarationDate !== undefined
      ? computeDeadline('DECLARATION', 'Declaration Delay', snapshot.declarationDate, allowedDeclaration)
      : undefined,
    commitmentDelay: snapshot.commitmentDate !== undefined
      ? computeDeadline('COMMITMENT', 'Commitment Delay', snapshot.commitmentDate, allowedCommitment)
      : undefined,
  };
}

export default DeadlineInfo;