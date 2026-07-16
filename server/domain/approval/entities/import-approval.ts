import type { ApprovalDecision } from './approval-decision';

/**
 * Represents an approval action taken on an import preview.
 * This is a domain value object that captures who made the decision,
 * what decision was made, when it was made, and an optional reason.
 */
export interface ImportApproval {
  /** The decision that was made (APPROVE_IMPORT, CANCEL_IMPORT, PARTIAL_APPROVAL). */
  readonly decision: ApprovalDecision;

  /** The user or system actor that made the decision. */
  readonly approvedBy: string;

  /** ISO-8601 timestamp of when the decision was made. */
  readonly approvedAt: string;

  /** Optional reason or comment explaining the decision. */
  readonly reason: string | null;
}

export default ImportApproval;