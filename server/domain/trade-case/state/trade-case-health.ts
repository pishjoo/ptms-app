import type { TradeCaseStage } from './trade-case-stage';

/**
 * Operational health status of a trade case.
 */
export type HealthStatus = 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';

/**
 * Risk level associated with a trade case.
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Health evaluation result for a trade case.
 */
export interface TradeCaseHealth {
  /** Current operational health. */
  readonly status: HealthStatus;

  /** Risk level based on stage completeness and pending actions. */
  readonly riskLevel: RiskLevel;

  /** The current stage label for display. */
  readonly currentStage: TradeCaseStage;

  /** The next expected stage. */
  readonly nextStage: TradeCaseStage;

  /** Whether all stages are complete. */
  readonly completed: boolean;
}

export default TradeCaseHealth;