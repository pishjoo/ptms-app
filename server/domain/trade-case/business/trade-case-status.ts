export type TradeCaseHealthStatus = 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'COMPLETED';

export interface TradeCaseStatus {
  readonly healthStatus: TradeCaseHealthStatus;
  readonly currentStage: string;
  readonly nextExpectedStage: string;
}

export class TradeCaseStatusService {
  public calculate(progress: { readonly completionPercent: number; readonly currentStage: string; readonly nextExpectedStage: string }): TradeCaseStatus {
    if (progress.completionPercent >= 100) {
      return {
        healthStatus: 'COMPLETED',
        currentStage: progress.currentStage,
        nextExpectedStage: progress.nextExpectedStage,
      };
    }

    if (progress.completionPercent >= 60) {
      return {
        healthStatus: 'ON_TRACK',
        currentStage: progress.currentStage,
        nextExpectedStage: progress.nextExpectedStage,
      };
    }

    if (progress.completionPercent >= 30) {
      return {
        healthStatus: 'AT_RISK',
        currentStage: progress.currentStage,
        nextExpectedStage: progress.nextExpectedStage,
      };
    }

    return {
      healthStatus: 'DELAYED',
      currentStage: progress.currentStage,
      nextExpectedStage: progress.nextExpectedStage,
    };
  }
}
