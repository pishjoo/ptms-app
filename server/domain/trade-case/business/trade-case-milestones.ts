import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';

export interface TradeCaseMilestones {
  readonly registrationOrder: number;
  readonly currencyAllocation: number;
  readonly originRegistration: number;
  readonly customsDeclaration: number;
  readonly commitmentSettlement: number;
}

export class TradeCaseMilestonesService {
  public calculate(tradeCase: TradeCaseAggregate): TradeCaseMilestones {
    return {
      registrationOrder: tradeCase.registrationNumber ? 100 : 0,
      currencyAllocation: tradeCase.approvedAllocation > 0 ? 100 : 0,
      originRegistration: tradeCase.registeredOrigin > 0 ? 100 : 0,
      customsDeclaration: tradeCase.declaredAmount > 0 ? 100 : 0,
      commitmentSettlement: tradeCase.commitmentCleared > 0 ? 100 : 0,
    };
  }
}
