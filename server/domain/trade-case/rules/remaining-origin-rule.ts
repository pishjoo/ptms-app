import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import type { TradeCaseRule, TradeCaseRuleEvaluationResult } from './trade-case-rule';
import { BusinessPriority } from '../state/business-priority';

/**
 * Placeholder rule for remaining origin monitoring.
 */
export class RemainingOriginRule implements TradeCaseRule {
  /**
   * Stable identifier for the rule.
   */
  public readonly id = 'remaining-origin-rule';

  /**
   * Display name for the rule.
   */
  public readonly name = 'Remaining Origin';

  /**
   * Human-readable description of the rule purpose.
   */
  public readonly description = 'Monitors remaining origin thresholds for a trade case.';

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
