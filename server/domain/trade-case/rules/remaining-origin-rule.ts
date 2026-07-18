import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import type { TradeCaseRule, TradeCaseRuleEvaluationResult } from './trade-case-rule';
import { TradeCaseActivityStatus } from '../state/trade-case-activity-status';
import { BusinessPriority } from '../state/business-priority';

/**
 * Rule that monitors remaining origin thresholds for a trade case.
 *
 * This rule generates alerts when:
 * - The trade case is NOT completed
 * - AND remainingOrigin is high relative to defined thresholds
 *
 * High remaining origin indicates unregistered origin certificates
 * that may require follow-up action.
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
  public readonly description = 'Monitors remaining origin thresholds for active trade cases with unregistered origin certificates.';

  /**
   * Threshold above which remaining origin is considered high.
   */
  private readonly highThreshold: number;

  /**
   * Threshold above which remaining origin is considered critical.
   */
  private readonly criticalThreshold: number;

  /**
   * @param highThreshold - The threshold above which remaining origin is flagged as high (default: 50000).
   * @param criticalThreshold - The threshold above which remaining origin is flagged as critical (default: 100000).
   */
  constructor(highThreshold = 50000, criticalThreshold = 100000) {
    this.highThreshold = highThreshold;
    this.criticalThreshold = criticalThreshold;
  }

  /**
   * Evaluates the trade case against the rule.
   */
  public evaluate(snapshot: TradeCaseStateSnapshot): TradeCaseRuleEvaluationResult {
    // Completed trade cases never generate origin alerts
    if (snapshot.activityStatus === TradeCaseActivityStatus.COMPLETED) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'Trade case is completed. No origin threshold alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    const remaining = snapshot.remainingOrigin;

    // If remaining origin is at or below zero, no alert needed
    if (remaining <= 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'Remaining origin is fully registered or zero. No alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    // Check against critical threshold
    if (remaining >= this.criticalThreshold) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        message: `Remaining origin is critically high: ${remaining}. Threshold: ${this.criticalThreshold}.`,
        priority: BusinessPriority.CRITICAL,
      };
    }

    // Check against high threshold
    if (remaining >= this.highThreshold) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        message: `Remaining origin is high: ${remaining}. Threshold: ${this.highThreshold}.`,
        priority: BusinessPriority.HIGH,
      };
    }

    // Remaining origin is within acceptable range
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      message: `Remaining origin (${remaining}) is within normal range.`,
      priority: BusinessPriority.LOW,
    };
  }
}
