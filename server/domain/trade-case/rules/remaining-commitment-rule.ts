import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import type { TradeCaseRule, TradeCaseRuleEvaluationResult } from './trade-case-rule';
import { TradeCaseActivityStatus } from '../state/trade-case-activity-status';
import { BusinessPriority } from '../state/business-priority';

/**
 * Rule that monitors remaining commitment thresholds for a trade case.
 *
 * This rule generates alerts when:
 * - The trade case is NOT completed
 * - AND remainingCommitment is high relative to defined thresholds
 *
 * High remaining commitment indicates uncleared obligations
 * that may require follow-up action.
 */
export class RemainingCommitmentRule implements TradeCaseRule {
  /**
   * Stable identifier for the rule.
   */
  public readonly id = 'remaining-commitment-rule';

  /**
   * Display name for the rule.
   */
  public readonly name = 'Remaining Commitment';

  /**
   * Human-readable description of the rule purpose.
   */
  public readonly description = 'Monitors remaining commitment thresholds for active trade cases with uncleared obligations.';

  /**
   * Threshold above which remaining commitment is considered high.
   */
  private readonly highThreshold: number;

  /**
   * Threshold above which remaining commitment is considered critical.
   */
  private readonly criticalThreshold: number;

  /**
   * @param highThreshold - The threshold above which remaining commitment is flagged as high (default: 50000).
   * @param criticalThreshold - The threshold above which remaining commitment is flagged as critical (default: 100000).
   */
  constructor(highThreshold = 50000, criticalThreshold = 100000) {
    this.highThreshold = highThreshold;
    this.criticalThreshold = criticalThreshold;
  }

  /**
   * Evaluates the trade case against the rule.
   */
  public evaluate(snapshot: TradeCaseStateSnapshot): TradeCaseRuleEvaluationResult {
    // Completed trade cases never generate commitment alerts
    if (snapshot.activityStatus === TradeCaseActivityStatus.COMPLETED) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'Trade case is completed. No commitment threshold alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    const remaining = snapshot.remainingCommitment;

    // If remaining commitment is at or below zero, no alert needed
    if (remaining <= 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'Remaining commitment is fully cleared or zero. No alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    // Check against critical threshold
    if (remaining >= this.criticalThreshold) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        message: `Remaining commitment is critically high: ${remaining}. Threshold: ${this.criticalThreshold}.`,
        priority: BusinessPriority.CRITICAL,
      };
    }

    // Check against high threshold
    if (remaining >= this.highThreshold) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        message: `Remaining commitment is high: ${remaining}. Threshold: ${this.highThreshold}.`,
        priority: BusinessPriority.HIGH,
      };
    }

    // Remaining commitment is within acceptable range
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      message: `Remaining commitment (${remaining}) is within normal range.`,
      priority: BusinessPriority.LOW,
    };
  }
}
