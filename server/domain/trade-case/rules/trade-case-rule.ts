import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import type { BusinessPriority } from '../state/business-priority';

/**
 * Typed result returned by a trade-case business rule.
 */
export interface TradeCaseRuleEvaluationResult {
  /**
   * Identifier of the evaluated rule.
   */
  readonly ruleId: string;

  /**
   * Human-readable name of the evaluated rule.
   */
  readonly ruleName: string;

  /**
   * Indicates whether the evaluated rule passed.
   */
  readonly passed: boolean;

  /**
   * Human-readable explanation for the evaluation result.
   */
  readonly message: string;

  /**
   * Business priority level for this rule evaluation.
   * Replaces simple severity with context-aware priority.
   */
  readonly priority: BusinessPriority;
}

/**
 * Contract for every trade-case business rule.
 *
 * Rules consume a TradeCaseStateSnapshot instead of the raw aggregate.
 * This ensures all rules use unified derived values and never recalculate
 * remaining balances, stage, health, risk, progress, deadlines, or next action.
 */
export interface TradeCaseRule {
  /**
   * Stable identifier for the rule.
   */
  readonly id: string;

  /**
   * Display name for the rule.
   */
  readonly name: string;

  /**
   * Human-readable description of the rule purpose.
   */
  readonly description: string;

  /**
   * Evaluates the rule against a trade-case state snapshot.
   */
  evaluate(snapshot: TradeCaseStateSnapshot): TradeCaseRuleEvaluationResult;
}

export default TradeCaseRule;