import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';
import { TradeCaseBalanceService } from './trade-case-balance';
import { TradeCaseProgressService } from './trade-case-progress';
import { TradeCaseStatusService } from './trade-case-status';

export interface TradeCaseHealth {
  readonly healthStatus: 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED';
  readonly completionPercent: number;
  readonly currentStage: string;
  readonly nextExpectedStage: string;
}

export class TradeCaseHealthService {
  constructor(
    private readonly progressService: TradeCaseProgressService = new TradeCaseProgressService(),
    private readonly balanceService: TradeCaseBalanceService = new TradeCaseBalanceService(),
    private readonly statusService: TradeCaseStatusService = new TradeCaseStatusService(),
  ) {}

  public calculate(tradeCase: TradeCaseAggregate): TradeCaseHealth {
    const progress = this.progressService.calculate(tradeCase);
    const balance = this.balanceService.calculate(tradeCase);
    const status = this.statusService.calculate(progress);

    const isAtRisk = balance.remainingAllocation > 0 || balance.remainingOrigin > 0 || balance.remainingDeclaration > 0 || balance.remainingCommitment > 0;

    return {
      healthStatus: this.resolveHealthStatus(status.healthStatus, isAtRisk),
      completionPercent: progress.completionPercent,
      currentStage: progress.currentStage,
      nextExpectedStage: progress.nextExpectedStage,
    };
  }

  private resolveHealthStatus(status: TradeCaseHealth['healthStatus'], isAtRisk: boolean): TradeCaseHealth['healthStatus'] {
    if (status === 'COMPLETED') {
      return 'COMPLETED';
    }

    if (isAtRisk && status === 'ON_TRACK') {
      return 'AT_RISK';
    }

    return status;
  }
}
