import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';
import type { TradeCaseCalculator } from './trade-case-calculator';

/**
 * Placeholder calculator for trade-case progress.
 */
export class TradeProgressCalculator implements TradeCaseCalculator<number> {
  /**
   * Stable identifier for the calculator.
   */
  public readonly id = 'progress';

  /**
   * Display name for the calculator.
   */
  public readonly name = 'Trade Progress';

  /**
   * Human-readable description of the calculator purpose.
   */
  public readonly description = 'Calculates progress for a trade case.';

  /**
   * Calculates the progress value for a trade case.
   */
  public calculate(_tradeCase: TradeCaseAggregate): number {
    return 0;
  }
}
