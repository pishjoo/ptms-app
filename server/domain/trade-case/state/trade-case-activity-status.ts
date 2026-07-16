/**
 * Represents the operational activity status of a trade case.
 * This is a context-aware status that drives business rule evaluation
 * and alert generation, replacing simple date-aware expiration checks.
 */
export enum TradeCaseActivityStatus {
  /**
   * The trade case is actively progressing through the workflow.
   */
  ACTIVE = 'ACTIVE',

  /**
   * The trade case has been completed successfully.
   * No expiration alerts should be generated for completed trade cases.
   */
  COMPLETED = 'COMPLETED',

  /**
   * The trade case is blocked by a dependency or external factor.
   */
  BLOCKED = 'BLOCKED',

  /**
   * The trade case is waiting for bank confirmation or settlement.
   */
  WAITING_BANK = 'WAITING_BANK',

  /**
   * The trade case is waiting for customs clearance or declaration.
   */
  WAITING_CUSTOMS = 'WAITING_CUSTOMS',
}

export default TradeCaseActivityStatus;