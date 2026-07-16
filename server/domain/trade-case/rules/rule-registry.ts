import type { TradeCaseRule } from './trade-case-rule';
import { AllocationExpiryRule } from './allocation-expiry-rule';
import { RegistrationExpiryRule } from './registration-expiry-rule';
import { RemainingAllocationRule } from './remaining-allocation-rule';
import { RemainingCommitmentRule } from './remaining-commitment-rule';
import { RemainingDeclarationRule } from './remaining-declaration-rule';
import { RemainingOriginRule } from './remaining-origin-rule';

/**
 * Registry that collects trade-case rules for orchestration.
 */
export class RuleRegistry {
  /**
   * Rules available to the analyzer.
   */
  private readonly rules: readonly TradeCaseRule[];

  /**
   * Creates a rule registry from an explicit list of rules.
   */
  constructor(rules: readonly TradeCaseRule[] = []) {
    this.rules = rules;
  }

  /**
   * Creates a registry that automatically collects the built-in rules.
   */
  public static createDefault(): RuleRegistry {
    return new RuleRegistry([
      new RegistrationExpiryRule(),
      new AllocationExpiryRule(),
      new RemainingAllocationRule(),
      new RemainingOriginRule(),
      new RemainingDeclarationRule(),
      new RemainingCommitmentRule(),
    ]);
  }

  /**
   * Returns the registered rules in execution order.
   */
  public getRules(): readonly TradeCaseRule[] {
    return this.rules;
  }
}
