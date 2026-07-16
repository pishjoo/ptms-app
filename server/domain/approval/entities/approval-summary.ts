import type { ApprovalDecision } from './approval-decision';

/**
 * Summary of the approval process for an import preview.
 * Provides aggregate counts and the overall decision outcome.
 */
export interface ApprovalSummary {
  /** Total number of trade cases in the preview. */
  readonly totalTradeCases: number;

  /** Total number of entity records (rows) across all trade cases. */
  readonly totalEntities: number;

  /** Number of entities classified as "create". */
  readonly entitiesToCreate: number;

  /** Number of entities classified as "update". */
  readonly entitiesToUpdate: number;

  /** Number of entities classified as "ignore" (unchanged). */
  readonly entitiesToIgnore: number;

  /** Number of entities with manual fields that need user preservation. */
  readonly entitiesWithManualFields: number;

  /** The final approval decision applied. */
  readonly decision: ApprovalDecision;

  /** ISO-8601 timestamp of the approval summary creation. */
  readonly createdAt: string;
}

export default ApprovalSummary;