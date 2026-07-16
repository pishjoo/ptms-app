import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';

export interface TradeCaseProgress {
  readonly completionPercent: number;
  readonly currentStage: string;
  readonly nextExpectedStage: string;
  readonly milestoneCompletion: Record<string, number>;
}

export class TradeCaseProgressService {
  public calculate(tradeCase: TradeCaseAggregate): TradeCaseProgress {
    const completedStages = this.countCompletedStages(tradeCase);
    const totalStages = 5;
    const completionPercent = Math.round((completedStages / totalStages) * 100);

    const stageOrder = [
      'Registration Order',
      'Currency Allocation',
      'Origin Registration',
      'Customs Declaration',
      'Commitment Settlement',
    ];

    const currentStage = this.resolveCurrentStage(tradeCase, stageOrder);
    const nextExpectedStage = this.resolveNextExpectedStage(tradeCase, stageOrder);

    return {
      completionPercent,
      currentStage,
      nextExpectedStage,
      milestoneCompletion: {
        'Registration Order': this.stageCompletion(tradeCase.registrationNumber ? 1 : 0),
        'Currency Allocation': this.stageCompletion(tradeCase.approvedAllocation > 0 ? 1 : 0),
        'Origin Registration': this.stageCompletion(tradeCase.registeredOrigin > 0 ? 1 : 0),
        'Customs Declaration': this.stageCompletion(tradeCase.declaredAmount > 0 ? 1 : 0),
        'Commitment Settlement': this.stageCompletion(tradeCase.commitmentCleared > 0 ? 1 : 0),
      },
    };
  }

  private countCompletedStages(tradeCase: TradeCaseAggregate): number {
    let completed = 0;
    if (tradeCase.registrationNumber) completed += 1;
    if (tradeCase.approvedAllocation > 0) completed += 1;
    if (tradeCase.registeredOrigin > 0) completed += 1;
    if (tradeCase.declaredAmount > 0) completed += 1;
    if (tradeCase.commitmentCleared > 0) completed += 1;
    return completed;
  }

  private resolveCurrentStage(tradeCase: TradeCaseAggregate, stageOrder: readonly string[]): string {
    if (tradeCase.commitmentCleared > 0) {
      return stageOrder[4];
    }
    if (tradeCase.declaredAmount > 0) {
      return stageOrder[3];
    }
    if (tradeCase.registeredOrigin > 0) {
      return stageOrder[2];
    }
    if (tradeCase.approvedAllocation > 0) {
      return stageOrder[1];
    }
    if (tradeCase.registrationNumber) {
      return stageOrder[0];
    }
    return stageOrder[0];
  }

  private resolveNextExpectedStage(tradeCase: TradeCaseAggregate, stageOrder: readonly string[]): string {
    if (!tradeCase.registrationNumber) {
      return stageOrder[0];
    }
    if (tradeCase.approvedAllocation <= 0) {
      return stageOrder[1];
    }
    if (tradeCase.registeredOrigin <= 0) {
      return stageOrder[2];
    }
    if (tradeCase.declaredAmount <= 0) {
      return stageOrder[3];
    }
    if (tradeCase.commitmentCleared <= 0) {
      return stageOrder[4];
    }
    return 'Completed';
  }

  private stageCompletion(value: number): number {
    return value > 0 ? 100 : 0;
  }
}
