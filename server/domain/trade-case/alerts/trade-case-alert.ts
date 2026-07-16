import type { BusinessPriority } from '../state/business-priority';

/**
 * Alert shape used by the trade-case domain layer.
 */
export interface TradeCaseAlert {
  /**
   * Stable identifier for the alert.
   */
  readonly id: string;

  /**
   * Display title for the alert.
   */
  readonly title: string;

  /**
   * Business priority level for the alert.
   * Replaces simple severity with context-aware priority.
   */
  readonly priority: BusinessPriority;

  /**
   * Human-readable message describing the alert.
   */
  readonly message: string;
}

export default TradeCaseAlert;