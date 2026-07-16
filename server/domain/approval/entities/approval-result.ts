import type { ApprovalDecision } from './approval-decision';
import type { ImportApproval } from './import-approval';
import type { ApprovalSummary } from './approval-summary';
import type { ExecutionPlan } from './execution-plan';

/**
 * The complete result of processing an approval decision on an import preview.
 * Contains the approval metadata, the execution plan, and a summary.
 */
export interface ApprovalResult {
  /** The approval decision and actor information. */
  readonly approval: ImportApproval;

  /** The execution plan derived from the preview and decision. */
  readonly executionPlan: ExecutionPlan;

  /** Aggregate summary of the approval outcome. */
  readonly summary: ApprovalSummary;

  /** Whether the approval was processed successfully. */
  readonly success: boolean;

  /** Error message if the approval processing failed. */
  readonly error: string | null;
}

export default ApprovalResult;