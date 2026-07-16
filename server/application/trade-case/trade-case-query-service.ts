import type { TradeCaseAggregate } from '../../domain/trade-case/entities/trade-case-aggregate';

type TradeCaseQueryResult = {
  readonly id: string;
  readonly referenceNo: string | null;
  readonly status: string;
  readonly lastActivityAt: Date | null;
  readonly company: {
    readonly name: string;
  } | null;
  readonly createdBy: {
    readonly name: string | null;
  } | null;
  readonly currencyRequests: ReadonlyArray<{
    readonly status: string;
    readonly amount: number | string | null;
  }>;
};

interface TradeCaseQueryClient {
  readonly tradeCase: {
    findUnique(args: {
      where: { id: string };
      include: {
        company: boolean;
        registrationOrders: boolean;
        currencyRequests: boolean;
        ntswProcesses: boolean;
        shipments: boolean;
        customsDeclarations: boolean;
        documents: boolean;
        tasks: boolean;
        timelines: boolean;
        statusHistory: boolean;
        comments: boolean;
      };
    }): Promise<TradeCaseQueryResult | null>;
  };
}

/**
 * Application service responsible for loading trade-case data from Prisma and mapping it to the domain aggregate.
 */
export class TradeCaseQueryService {
  /**
   * Prisma client instance injected by the caller.
   */
  constructor(private readonly prismaClient: TradeCaseQueryClient) {}

  /**
   * Loads a single trade case from Prisma and converts it to a domain aggregate.
   */
  public async getTradeCaseAggregate(tradeCaseId: string): Promise<TradeCaseAggregate | null> {
    const prismaTradeCase = await this.prismaClient.tradeCase.findUnique({
      where: { id: tradeCaseId },
      include: {
        company: true,
        registrationOrders: true,
        currencyRequests: true,
        ntswProcesses: true,
        shipments: true,
        customsDeclarations: true,
        documents: true,
        tasks: true,
        timelines: true,
        statusHistory: true,
        comments: true,
      },
    });

    if (!prismaTradeCase) {
      return null;
    }

    return this.toAggregate(prismaTradeCase);
  }

  /**
   * Maps a Prisma trade-case payload to the domain aggregate.
   */
  private toAggregate(prismaTradeCase: TradeCaseQueryResult): TradeCaseAggregate {
    const approvedAllocation = prismaTradeCase.currencyRequests.reduce<number>((total, request) => {
      if (request.status === 'APPROVED' && request.amount !== null) {
        return total + Number(request.amount);
      }

      return total;
    }, 0);

    return {
      id: prismaTradeCase.id,
      registrationNumber: prismaTradeCase.referenceNo,
      companyName: prismaTradeCase.company?.name ?? 'Unknown company',
      status: prismaTradeCase.status,
      lastActivityAt: prismaTradeCase.lastActivityAt,
      assignedUser: prismaTradeCase.createdBy?.name ?? null,
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
