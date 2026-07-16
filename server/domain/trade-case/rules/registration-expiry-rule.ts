import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import type { TradeCaseRule, TradeCaseRuleEvaluationResult } from './trade-case-rule';
import { TradeCaseActivityStatus } from '../state/trade-case-activity-status';
import { BusinessPriority } from '../state/business-priority';

/**
 * Rule that evaluates registration expiry conditions for a trade case.
 *
 * This rule is context-aware and only generates alerts when:
 * - The trade case is NOT completed (ACTIVE, BLOCKED, WAITING_BANK, WAITING_CUSTOMS)
 * - AND at least one of the following has remaining value:
 *   - Remaining Origin > 0
 *   - Remaining Declaration > 0
 *   - Remaining Commitment > 0
 *
 * Completed trade cases never generate expiration alerts.
 */
export class RegistrationExpiryRule implements TradeCaseRule {
  /**
   * Stable identifier for the rule.
   */
  public readonly id = 'registration-expiry-rule';

  /**
   * Display name for the rule.
   */
  public readonly name = 'Registration Expiry';

  /**
   * Human-readable description of the rule purpose.
   */
  public readonly description = 'Monitors registration expiry conditions for active trade cases with remaining obligations.';

  /**
   * Evaluates the trade case against the rule.
   */
  public evaluate(snapshot: TradeCaseStateSnapshot): TradeCaseRuleEvaluationResult {
    // Completed trade cases never generate expiration alerts
    if (snapshot.activityStatus === TradeCaseActivityStatus.COMPLETED) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'Trade case is completed. No expiration alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    // Check if there are remaining obligations
    const hasRemainingObligations =
      snapshot.remainingOrigin > 0 ||
      snapshot.remainingDeclaration > 0 ||
      snapshot.remainingCommitment > 0;

    if (!hasRemainingObligations) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        message: 'No remaining obligations. No expiration alert required.',
        priority: BusinessPriority.LOW,
      };
    }

    // Determine priority based on remaining obligations
    const priority = this.calculatePriority(snapshot);

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: false,
      message: `Registration expiry alert: trade case is ${snapshot.activityStatus} with remaining obligations (Origin: ${snapshot.remainingOrigin}, Declaration: ${snapshot.remainingDeclaration}, Commitment: ${snapshot.remainingCommitment}).`,
      priority,
    };
  }

  /**
   * Calculate business priority based on remaining obligations and urgency factors.
   */
  private calculatePriority(snapshot: TradeCaseStateSnapshot): BusinessPriority {
    let score = 0;

    // Factor 1: Large remaining origin increases priority
    if (snapshot.remainingOrigin > 100000) {
      score += 2;
    } else if (snapshot.remainingOrigin > 0) {
      score += 1;
    }

    // Factor 2: Large remaining declaration increases priority
    if (snapshot.remainingDeclaration > 100000) {
      score += 2;
    } else if (snapshot.remainingDeclaration > 0) {
      score += 1;
    }

    // Factor 3: Large remaining commitment increases priority
    if (snapshot.remainingCommitment > 100000) {
      score += 2;
    } else if (snapshot.remainingCommitment > 0) {
      score += 1;
    }

    // Map score to priority level
    if (score >= 5) {
      return BusinessPriority.CRITICAL;
    } else if (score >= 3) {
      return BusinessPriority.HIGH;
    } else if (score >= 1) {
      return BusinessPriority.MEDIUM;
    }

    return BusinessPriority.LOW;
  }
}

export default RegistrationExpiryRule;