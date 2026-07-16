/**
 * Represents the three possible approval decisions that can be made
 * on an import preview before it is persisted to the database.
 *
 * - APPROVE_IMPORT:  Accept all changes and proceed with the full execution plan.
 * - CANCEL_IMPORT:   Reject all changes and abort the import entirely.
 * - PARTIAL_APPROVAL: Accept only a subset of changes (reserved for future use).
 */
export enum ApprovalDecision {
  APPROVE_IMPORT = 'APPROVE_IMPORT',
  CANCEL_IMPORT = 'CANCEL_IMPORT',
  PARTIAL_APPROVAL = 'PARTIAL_APPROVAL',
}

export default ApprovalDecision;