import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';

/**
 * Contract for calculators that produce derived values from a trade case.
 */
export interface TradeCaseCalculator<TValue> {
  /**
   * Stable identifier for the calculator.
   */
  readonly id: string;

  /**
   * Display name for the calculator.
   */
  readonly name: string;

  /**
   * Human-readable description of the calculator purpose.
   */
  readonly description: string;

  /**
   * Produces a calculated value from a trade-case aggregate.
   */
  calculate(tradeCase: TradeCaseAggregate): TValue;
}
