import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';

export interface TradeCaseBalance {
  readonly remainingAllocation: number;
  readonly remainingOrigin: number;
  readonly remainingDeclaration: number;
  readonly remainingCommitment: number;
}

export class TradeCaseBalanceService {
  public calculate(tradeCase: TradeCaseAggregate): TradeCaseBalance {
    return {
      remainingAllocation: tradeCase.remainingAllocation,
      remainingOrigin: tradeCase.remainingOrigin,
      remainingDeclaration: tradeCase.remainingDeclaration,
      remainingCommitment: tradeCase.remainingCommitment,
    };
  }
}
