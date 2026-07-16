import type { TradeCaseStage } from './trade-case-stage';

/**
 * Describes the next required action for a trade case.
 */
export interface NextAction {
  /** Unique action code for programmatic use. */
  readonly code: NextActionCode;

  /** Human-readable action label. */
  readonly label: string;

  /** The stage this action belongs to. */
  readonly stage: TradeCaseStage;

  /** Priority order (lower = more urgent). */
  readonly priority: number;
}

/**
 * Enumerated set of possible next actions.
 */
export type NextActionCode =
  | 'REGISTER_TRADE_CASE'
  | 'REQUEST_ALLOCATION'
  | 'WAIT_BANK_APPROVAL'
  | 'REGISTER_ORIGIN'
  | 'SUBMIT_DECLARATION'
  | 'COMPLETE_COMMITMENT'
  | 'COMPLETED';

/**
 * Predefined next action definitions.
 */
export const NEXT_ACTIONS: Record<NextActionCode, NextAction> = {
  REGISTER_TRADE_CASE: {
    code: 'REGISTER_TRADE_CASE',
    label: 'Register Trade Case',
    stage: 'REGISTRATION',
    priority: 1,
  },
  REQUEST_ALLOCATION: {
    code: 'REQUEST_ALLOCATION',
    label: 'Request Allocation',
    stage: 'ALLOCATION',
    priority: 2,
  },
  WAIT_BANK_APPROVAL: {
    code: 'WAIT_BANK_APPROVAL',
    label: 'Wait Bank Approval',
    stage: 'ALLOCATION',
    priority: 3,
  },
  REGISTER_ORIGIN: {
    code: 'REGISTER_ORIGIN',
    label: 'Register Origin',
    stage: 'ORIGIN',
    priority: 4,
  },
  SUBMIT_DECLARATION: {
    code: 'SUBMIT_DECLARATION',
    label: 'Submit Declaration',
    stage: 'DECLARATION',
    priority: 5,
  },
  COMPLETE_COMMITMENT: {
    code: 'COMPLETE_COMMITMENT',
    label: 'Complete Commitment',
    stage: 'COMMITMENT',
    priority: 6,
  },
  COMPLETED: {
    code: 'COMPLETED',
    label: 'Completed',
    stage: 'COMPLETED',
    priority: 7,
  },
};

/**
 * Determine the next action based on a stage snapshot.
 *
 * @param snapshot - The current data snapshot for a trade case.
 * @returns The appropriate NextAction.
 */
export function resolveNextAction(snapshot: {
  hasRegistration: boolean;
  hasAllocation: boolean;
  hasOrigin: boolean;
  hasDeclaration: boolean;
  hasCommitment: boolean;
}): NextAction {
  if (!snapshot.hasRegistration) {
    return NEXT_ACTIONS.REGISTER_TRADE_CASE;
  }

  if (!snapshot.hasAllocation) {
    return NEXT_ACTIONS.REQUEST_ALLOCATION;
  }

  if (!snapshot.hasOrigin) {
    return NEXT_ACTIONS.REGISTER_ORIGIN;
  }

  if (!snapshot.hasDeclaration) {
    return NEXT_ACTIONS.SUBMIT_DECLARATION;
  }

  if (!snapshot.hasCommitment) {
    return NEXT_ACTIONS.COMPLETE_COMMITMENT;
  }

  return NEXT_ACTIONS.COMPLETED;
}

export default NextAction;