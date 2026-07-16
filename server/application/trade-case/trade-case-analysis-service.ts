import type { TradeCaseAggregate } from '../../domain/trade-case/entities/trade-case-aggregate';
import { TradeCaseAnalyzer } from '../../domain/trade-case/services/trade-case-analyzer';
import type { TradeCaseAlert } from '../../domain/trade-case/alerts/trade-case-alert';
import type { TradeCaseSummary } from '../../domain/trade-case/dto/trade-case-summary';
import { TradeProgressCalculator } from '../../domain/trade-case/calculators/trade-progress-calculator';
import { TradeRiskCalculator } from '../../domain/trade-case/calculators/trade-risk-calculator';

/**
 * Application service responsible for running trade-case analysis against a domain aggregate.
 */
export class TradeCaseAnalysisService {
  /**
   * Analyzer instance injected by the caller.
   */
  constructor(private readonly analyzer: TradeCaseAnalyzer = new TradeCaseAnalyzer(
    undefined,
    [new TradeProgressCalculator(), new TradeRiskCalculator()],
  )) {}

  /**
   * Executes the analyzer and returns the resulting analysis payload.
   */
  public analyze(tradeCase: TradeCaseAggregate): {
    summary: TradeCaseSummary;
    alerts: TradeCaseAlert[];
    progress: number;
    risk: number;
    remainingAllocation: number;
    remainingOrigin: number;
    remainingDeclaration: number;
    remainingCommitment: number;
  } {
    const summary = this.analyzer.analyze(tradeCase);
    const alerts = this.analyzer.buildAlerts(tradeCase);

    return {
      summary,
      alerts,
      progress: summary.progress,
      risk: summary.risk,
      remainingAllocation: summary.remainingAllocation,
      remainingOrigin: summary.remainingOrigin,
      remainingDeclaration: summary.remainingDeclaration,
      remainingCommitment: summary.remainingCommitment,
    };
  }
}
