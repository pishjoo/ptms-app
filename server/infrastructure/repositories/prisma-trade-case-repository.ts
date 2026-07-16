import type { TradeCaseRepository } from '@/server/domain/repositories/trade-case-repository';
import type { TradeCaseAggregate } from '@/server/domain/trade-case/entities/trade-case-aggregate';

/**
 * Minimal Prisma client shape consumed by the TradeCase repository.
 * Only exposes the query methods actually used by this repository.
 */
export interface PrismaTradeCaseClient {
  tradeCase: {
    findUnique(args: {
      where: { id?: string; referenceNo?: string };
      include: {
        company: boolean;
        registrationOrders: boolean;
        currencyRequests: boolean;
      };
    }): Promise<PrismaTradeCaseRow | null>;

    findMany(args: {
      where?: { companyId?: string };
      take?: number;
      orderBy?: Record<string, string>;
      include: {
        company: boolean;
        registrationOrders: boolean;
        currencyRequests: boolean;
      };
    }): Promise<readonly PrismaTradeCaseRow[]>;
  };
}

/**
 * Shape of a row returned from Prisma's TradeCase find queries.
 */
export interface PrismaTradeCaseRow {
  id: string;
  referenceNo: string | null;
  status: string;
  companyId?: string;
  company: { name: string } | null;
  registrationOrders: ReadonlyArray<{
    orderNumber: string | null;
    status: string;
    submittedAt: Date | null;
  }>;
  currencyRequests: ReadonlyArray<{
    amount: number | string | null;
    status: string;
  }>;
}

/**
 * Prisma-backed TradeCaseRepository implementation.
 * Maps Prisma query results to domain TradeCaseAggregate objects.
 */
export class PrismaTradeCaseRepository implements TradeCaseRepository {
  constructor(private readonly prisma: PrismaTradeCaseClient) {}

  public async findById(id: string): Promise<TradeCaseAggregate | null> {
    const result = await this.prisma.tradeCase.findUnique({
      where: { id },
      include: { company: true, registrationOrders: true, currencyRequests: true },
    });

    if (!result) return null;

    return this.toAggregate(result);
  }

  public async findByRegistrationNumber(registrationNumber: string): Promise<TradeCaseAggregate | null> {
    const result = await this.prisma.tradeCase.findUnique({
      where: { referenceNo: registrationNumber },
      include: { company: true, registrationOrders: true, currencyRequests: true },
    });

    if (!result) return null;

    return this.toAggregate(result);
  }

  public async findAll(limit?: number): Promise<readonly TradeCaseAggregate[]> {
    const results = await this.prisma.tradeCase.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: { company: true, registrationOrders: true, currencyRequests: true },
    });

    return results.map((r) => this.toAggregate(r));
  }

  public async findByCompanyId(companyId: string, limit?: number): Promise<readonly TradeCaseAggregate[]> {
    const results = await this.prisma.tradeCase.findMany({
      where: { companyId },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: { company: true, registrationOrders: true, currencyRequests: true },
    });

    return results.map((r) => this.toAggregate(r));
  }

  private toAggregate(row: PrismaTradeCaseRow): TradeCaseAggregate {
    const approvedAllocation = row.currencyRequests.reduce<number>((total, request) => {
      if (request.status === 'APPROVED' && request.amount !== null) {
        return total + Number(request.amount);
      }
      return total;
    }, 0);

    return {
      id: row.id,
      registrationNumber: row.referenceNo,
      companyName: row.company?.name ?? 'Unknown company',
      status: row.status,
      lastActivityAt: null,
      assignedUser: null,
      approvedAllocation,
      remainingAllocation: approvedAllocation,
      registeredOrigin: 0,
      remainingOrigin: 0,
      declaredAmount: 0,
      remainingDeclaration: 0,
      commitmentCleared: 0,
      remainingCommitment: 0,
    };
  }
}

export default PrismaTradeCaseRepository;