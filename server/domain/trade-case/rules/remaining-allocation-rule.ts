import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import type { TradeCaseRule, TradeCaseRuleEvaluationResult } from './trade-case-rule';
import { TradeCaseActivityStatus } from '../state/trade-case-activity-status';
import { BusinessPriority } from '../state/business-priority';

/**
 * Rule that monitors remaining allocation thresholds for a trade case.
 *
 * This rule generates alerts when:
 * - The trade case is NOT completed
 * - AND remainingAllocation is high relative to typical thresholds
 *
 * Remaining allocation above defined thresholds indicates
 * unused capacity that may need attention.
 */
export class RemainingAllocationRule implements TradeCaseRule {
  /**
   * Stable identifier for the rule.
   */
  public readonly id = 'remaining-allocation-rule';

  /**
   * Display name for the rule.
   */
  public readonly name = 'Remaining Allocation';

  /**
   * Human-readable description of the rule purpose.
   */
  public readonly description = 'Monitors remaining allocation thresholds for active trade cases with unused capacity.';

  /**
   * Threshold above which remaining allocation is considered high.
   */
  private readonly highThreshold: number;

  /**
   * Threshold above which remaining allocation is considered critical.
   */
  private readonly criticalThreshold: number;

  /**
   * @param highThreshold - The threshold above which remaining allocation is flagged as high (default: 50000).
   * @param criticalThreshold - The threshold above which remaining allocation is flagged as critical (default: 100000).
   */
  constructor(highThreshold = 50000, criticalThreshold = 100000) {
    this.highThreshold = highThreshold;
    this.criticalThreshold = criticalThreshold;
  }

  /**
   * Evaluates the trade case against the rule.
   */
  public evaluate(snapshot: TradeCaseStateSnapshot): TradeCaseRuleEvaluationResult {
    // Completed trade cases never generate allocation alerts
    if (snapshot.activityStatus === TradeCaseActivityStatus.COMPLETED) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'Trade case is completed. No allocation threshold alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    const remaining = snapshot.remainingAllocation;

    // If remaining allocation is at or below zero, no alert needed
    if (remaining <= 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'Remaining allocation is fully utilized or zero. No alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    // Check against critical threshold
    if (remaining >= this.criticalThreshold) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        message: `Remaining allocation is critically high: ${remaining}. Threshold: ${this.criticalThreshold}.`,
        priority: BusinessPriority.CRITICAL,
      };
    }

    // Check against high threshold
    if (remaining >= this.highThreshold) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        message: `Remaining allocation is high: ${remaining}. Threshold: ${this.highThreshold}.`,
        priority: BusinessPriority.HIGH,
      };
    }

    // Remaining allocation is within acceptable range
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      message: `Remaining allocation (${remaining}) is within normal range.`,
      priority: BusinessPriority.LOW,
    };
  }
}
