import type { TradeCaseAggregate } from '@/server/domain/trade-case/entities/trade-case-aggregate';

/**
 * Temporary mock provider for dashboard development until a database-backed repository exists.
 */
export class MockTradeCaseProvider {
  public getTradeCase(): TradeCaseAggregate {
    return {
      id: 'trade-case-1001',
      registrationNumber: 'REG-2026-0148',
      companyName: 'Northwind Logistics Co.',
      status: 'Customs Declaration In Progress',
      lastActivityAt: new Date('2026-07-13T09:15:00.000Z'),
      assignedUser: 'A. Karimi',
      approvedAllocation: 1250000,
      remainingAllocation: 180000,
      registeredOrigin: 850000,
      remainingOrigin: 150000,
      declaredAmount: 780000,
      remainingDeclaration: 220000,
      commitmentCleared: 500000,
      remainingCommitment: 280000,
    };
  }
}
