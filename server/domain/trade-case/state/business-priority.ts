/**
 * Represents the business priority level for a trade case alert or rule evaluation.
 * Priority is context-aware and increases based on operational factors such as
 * expiry proximity, remaining balances, and overdue commitments/declarations.
 */
export enum BusinessPriority {
  /**
   * Low priority - informational or minor concern.
   */
  LOW = 'LOW',

  /**
   * Medium priority - requires attention but not urgent.
   */
  MEDIUM = 'MEDIUM',

  /**
   * High priority - requires prompt attention.
   */
  HIGH = 'HIGH',

  /**
   * Critical priority - requires immediate action.
   */
  CRITICAL = 'CRITICAL',
}

/**
 * Numeric weight assigned to each business priority level.
 * Used for calculating composite priority scores.
 */
export const BUSINESS_PRIORITY_WEIGHT: Record<BusinessPriority, number> = {
  [BusinessPriority.LOW]: 1,
  [BusinessPriority.MEDIUM]: 2,
  [BusinessPriority.HIGH]: 3,
  [BusinessPriority.CRITICAL]: 4,
};

export default BusinessPriority;