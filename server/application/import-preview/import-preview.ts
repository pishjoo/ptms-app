import type { PreviewSummary } from './preview-summary';
import type { PreviewItem } from './preview-item';
import type { PreviewWarning } from './preview-warning';
import type { PreviewError } from './preview-error';
import type { TradeCaseStage } from '@/server/domain/trade-case/state/trade-case-stage';
import type { HealthStatus, RiskLevel } from '@/server/domain/trade-case/state/trade-case-health';
import type { StageProgress } from '@/server/domain/trade-case/state/trade-case-progress';
import type { NextAction } from '@/server/domain/trade-case/state/next-action';
import type { DeadlineCollection } from '@/server/domain/trade-case/state/deadline-monitor';

/**
 * Registration block containing the imported registration information
 * and all associated records grouped by sheet type.
 */
export interface TradeCasePreviewRegistration {
  /** The registration number (trade case identifier). */
  readonly registrationNumber: string;

  /** Company name if available. */
  readonly companyName: string | null;

  /** Registration status if available. */
  readonly status: string | null;
}

/**
 * Allocation records that belong to a specific trade case.
 */
export interface TradeCasePreviewAllocation {
  /** All allocation rows for this registration. */
  readonly items: readonly PreviewItem[];
}

/**
 * Origin records that belong to a specific trade case.
 */
export interface TradeCasePreviewOrigin {
  /** All origin rows for this registration. */
  readonly items: readonly PreviewItem[];
}

/**
 * Declaration records that belong to a specific trade case.
 */
export interface TradeCasePreviewDeclaration {
  /** All declaration rows for this registration. */
  readonly items: readonly PreviewItem[];
}

/**
 * Commitment records that belong to a specific trade case.
 */
export interface TradeCasePreviewCommitment {
  /** All commitment rows for this registration. */
  readonly items: readonly PreviewItem[];
}

/**
 * State evaluation results attached to a trade case preview.
 */
export interface TradeCaseStateInfo {
  /** Current operational stage. */
  readonly currentStage: TradeCaseStage;

  /** Next expected stage. */
  readonly nextStage: TradeCaseStage;

  /** Overall progress percentage (0–100). */
  readonly progressPercent: number;

  /** Per-stage completion percentages. */
  readonly stageProgress: StageProgress;

  /** Operational health status. */
  readonly health: HealthStatus;

  /** Risk level. */
  readonly risk: RiskLevel;

  /** The next required action. */
  readonly nextAction: NextAction;

  /** Deadline monitoring results. */
  readonly deadlines: DeadlineCollection;
}

/**
 * A single trade case entry in the import preview.
 * Contains all data grouped by sheet type, warnings/errors,
 * and state evaluation results (stage, progress, health, risk, next action, deadlines).
 */
export interface TradeCasePreview {
  /** Registration summary. */
  readonly registration: TradeCasePreviewRegistration;

  /** Allocation records. */
  readonly allocation: TradeCasePreviewAllocation;

  /** Origin records. */
  readonly origin: TradeCasePreviewOrigin;

  /** Declaration records. */
  readonly declaration: TradeCasePreviewDeclaration;

  /** Commitment records. */
  readonly commitment: TradeCasePreviewCommitment;

  /** Warnings scoped to this trade case. */
  readonly warnings: readonly PreviewWarning[];

  /** Errors scoped to this trade case. */
  readonly errors: readonly PreviewError[];

  /** State evaluation (stage, progress, health, risk, next action, deadlines). */
  readonly state: TradeCaseStateInfo;
}

/**
 * Top-level preview object ready for React UI rendering.
 * Organises all detected changes by trade case and provides summary statistics.
 */
export interface ImportPreview {
  /** Overall summary statistics. */
  readonly summary: PreviewSummary;

  /** Trade-case-indexed preview data. */
  readonly tradeCases: Record<string, TradeCasePreview>;

  /** Warnings that could not be attributed to a specific registration. */
  readonly unassignedWarnings: readonly PreviewWarning[];

  /** Errors that could not be attributed to a specific registration. */
  readonly unassignedErrors: readonly PreviewError[];

  /** The originally detected file type. */
  readonly detectedFileType: string;

  /** Total rows processed from the raw import. */
  readonly totalRowsProcessed: number;
}

export default ImportPreview;