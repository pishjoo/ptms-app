// Domain entities and value objects
export type { ApprovalDecision } from './entities/approval-decision';
export { ApprovalDecision as ApprovalDecisionEnum } from './entities/approval-decision';
export type { ImportApproval } from './entities/import-approval';
export type { ApprovalSummary } from './entities/approval-summary';
export type { ApprovalResult } from './entities/approval-result';
export type {
  ExecutionPlan,
  EntityExecutionItem,
  EntityAction,
  ManualFieldPreservation,
} from './entities/execution-plan';

// Domain services
export type { ApprovalEngine } from './services/approval-engine';
export { DefaultApprovalEngine } from './services/approval-engine';