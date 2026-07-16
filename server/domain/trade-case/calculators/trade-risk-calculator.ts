import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';
import type { TradeCaseCalculator } from './trade-case-calculator';

/**
 * Placeholder calculator for trade-case risk.
 */
export class TradeRiskCalculator implements TradeCaseCalculator<number> {
  /**
   * Stable identifier for the calculator.
   */
  public readonly id = 'risk';

  /**
   * Display name for the calculator.
   */
  public readonly name = 'Trade Risk';

  /**
   * Human-readable description of the calculator purpose.
   */
  public readonly description = 'Calculates risk for a trade case.';

  /**
   * Calculates the risk value for a trade case.
   */
  public calculate(_tradeCase: TradeCaseAggregate): number {
    return 0;
  }
}
