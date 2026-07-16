import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';
import { TradeCaseBalanceService } from './trade-case-balance';
import { TradeCaseHealthService } from './trade-case-health';
import { TradeCaseMilestonesService } from './trade-case-milestones';
import { TradeCaseProgressService } from './trade-case-progress';

export interface TradeCaseBusinessKnowledge {
  readonly remainingAllocation: number;
  readonly remainingOrigin: number;
  readonly remainingDeclaration: number;
  readonly remainingCommitment: number;
  readonly completionPercent: number;
  readonly currentStage: string;
  readonly nextExpectedStage: string;
  readonly healthStatus: 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED';
  readonly milestoneCompletion: Record<string, number>;
}

export class TradeCaseRulesService {
  constructor(
    private readonly balanceService: TradeCaseBalanceService = new TradeCaseBalanceService(),
    private readonly progressService: TradeCaseProgressService = new TradeCaseProgressService(),
    private readonly milestonesService: TradeCaseMilestonesService = new TradeCaseMilestonesService(),
    private readonly healthService: TradeCaseHealthService = new TradeCaseHealthService(),
  ) {}

  public evaluate(tradeCase: TradeCaseAggregate): TradeCaseBusinessKnowledge {
    const balance = this.balanceService.calculate(tradeCase);
    const progress = this.progressService.calculate(tradeCase);
    const milestones = this.milestonesService.calculate(tradeCase);
    const health = this.healthService.calculate(tradeCase);

    return {
      remainingAllocation: balance.remainingAllocation,
      remainingOrigin: balance.remainingOrigin,
      remainingDeclaration: balance.remainingDeclaration,
      remainingCommitment: balance.remainingCommitment,
      completionPercent: progress.completionPercent,
      currentStage: progress.currentStage,
      nextExpectedStage: progress.nextExpectedStage,
      healthStatus: health.healthStatus,
      milestoneCompletion: {
        'Registration Order': milestones.registrationOrder,
        'Currency Allocation': milestones.currencyAllocation,
        'Origin Registration': milestones.originRegistration,
        'Customs Declaration': milestones.customsDeclaration,
        'Commitment Settlement': milestones.commitmentSettlement,
      },
    };
  }
}
