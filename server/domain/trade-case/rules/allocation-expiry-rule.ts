import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import type { TradeCaseRule, TradeCaseRuleEvaluationResult } from './trade-case-rule';
import { BusinessPriority } from '../state/business-priority';

/**
 * Placeholder rule for allocation expiry monitoring.
 */
export class AllocationExpiryRule implements TradeCaseRule {
  /**
   * Stable identifier for the rule.
   */
  public readonly id = 'allocation-expiry-rule';

  /**
   * Display name for the rule.
   */
  public readonly name = 'Allocation Expiry';

  /**
   * Human-readable description of the rule purpose.
   */
  public readonly description = 'Monitors allocation expiry conditions for a trade case.';

  /**
   * Evaluates the trade case against the rule.
   */
  public evaluate(_snapshot: TradeCaseStateSnapshot): TradeCaseRuleEvaluationResult {
    // TODO
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      message: 'Rule not implemented yet.',
      priority: BusinessPriority.LOW,
    };
  }
}
