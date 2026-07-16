import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';
import type { TradeCaseCalculator } from '../calculators/trade-case-calculator';
import type { TradeCaseRuleEvaluationResult } from '../rules/trade-case-rule';
import { RuleRegistry } from '../rules/rule-registry';
import type { TradeCaseSummary } from '../dto/trade-case-summary';
import type { TradeCaseAlert } from '../alerts/trade-case-alert';
import type { BusinessPriority } from '../state/business-priority';
import type { TradeCaseStateSnapshot } from '../state/trade-case-state-snapshot';
import { TradeCaseStateSnapshotBuilder } from '../state/trade-case-state-snapshot-builder';

const CALCULATOR_IDS = {
  progress: 'progress',
  risk: 'risk',
} as const;

/**
 * Orchestrates trade-case rules and calculators into a summary.
 */
export class TradeCaseAnalyzer {
  /**
   * Registry used to resolve the available business rules.
   */
  private readonly ruleRegistry: RuleRegistry;

  /**
   * Calculators used to build the trade-case summary.
   */
  private readonly calculators: readonly TradeCaseCalculator<unknown>[];

  /**
   * Creates a new analyzer with dependencies supplied by the caller.
   */
  constructor(
    ruleRegistry: RuleRegistry = RuleRegistry.createDefault(),
    calculators: readonly TradeCaseCalculator<unknown>[] = [],
    private readonly snapshotBuilder: TradeCaseStateSnapshotBuilder = new TradeCaseStateSnapshotBuilder(),
  ) {
    this.ruleRegistry = ruleRegistry;
    this.calculators = calculators;
  }

  /**
   * Analyzes one trade case and produces a summary.
   */
  public analyze(tradeCase: TradeCaseAggregate): TradeCaseSummary {
    const snapshot = this.snapshotBuilder.build(tradeCase);
    const evaluationResults = this.evaluateRules(snapshot);
    const alerts = this.collectAlerts(evaluationResults);

    return {
      tradeCaseId: tradeCase.id,
      registrationNumber: tradeCase.registrationNumber,
      companyName: tradeCase.companyName,
      currentStatus: tradeCase.status,
      progress: this.calculateValue<number>(CALCULATOR_IDS.progress, tradeCase),
      risk: this.calculateValue<number>(CALCULATOR_IDS.risk, tradeCase),
      approvedAllocation: tradeCase.approvedAllocation,
      remainingAllocation: tradeCase.remainingAllocation,
      registeredOrigin: tradeCase.registeredOrigin,
      remainingOrigin: tradeCase.remainingOrigin,
      declaredAmount: tradeCase.declaredAmount,
      remainingDeclaration: tradeCase.remainingDeclaration,
      commitmentCleared: tradeCase.commitmentCleared,
      remainingCommitment: tradeCase.remainingCommitment,
      warningsCount: alerts.filter((alert) => alert.priority === 'MEDIUM' || alert.priority === 'HIGH' || alert.priority === 'CRITICAL').length,
      upcomingDeadlinesCount: 0,
      lastActivity: tradeCase.lastActivityAt,
      assignedUser: tradeCase.assignedUser,
    };
  }

  /**
   * Executes the configured rules for a trade case.
   */
  public evaluateRules(snapshot: TradeCaseStateSnapshot): TradeCaseRuleEvaluationResult[] {
    return this.ruleRegistry.getRules().map((rule) => rule.evaluate(snapshot));
  }

  /**
   * Converts trade-case rules into alerts.
   */
  public buildAlerts(tradeCase: TradeCaseAggregate): TradeCaseAlert[] {
    const snapshot = this.snapshotBuilder.build(tradeCase);
    return this.collectAlerts(this.evaluateRules(snapshot));
  }

  /**
   * Converts rule evaluation results into alerts.
   */
  private collectAlerts(results: readonly TradeCaseRuleEvaluationResult[]): TradeCaseAlert[] {
    return results
      .filter((result) => !result.passed)
      .map((result) => ({
        id: result.ruleId,
        title: result.ruleName,
        priority: result.priority,
        message: result.message,
      }));
  }

  /**
   * Resolves a calculator value by identifier.
   */
  private calculateValue<TValue>(calculatorId: string, tradeCase: TradeCaseAggregate): TValue {
    const calculator = this.calculators.find((candidate) => candidate.id === calculatorId);

    if (!calculator) {
      return 0 as TValue;
    }

    return calculator.calculate(tradeCase) as TValue;
  }
}
