import type { AllocationRepository } from '@/server/domain/repositories/allocation-repository';
import type { AllocationImportDto } from '@/server/import/dto/allocation-import.dto';

/**
 * Minimal Prisma client shape consumed by the Allocation repository.
 */
export interface PrismaAllocationClient {
  currencyRequest: {
    findMany(args: {
      where?: { tradeCaseId?: string; requestNumber?: string };
      take?: number;
      orderBy?: Record<string, string>;
    }): Promise<ReadonlyArray<{
      requestNumber: string | null;
      currencyCode: string;
      amount: number | string | null;
      approvedAt: Date | null;
    }>>;

    findUnique(args: {
      where: { requestNumber: string };
    }): Promise<{
      requestNumber: string | null;
      currencyCode: string;
      amount: number | string | null;
      approvedAt: Date | null;
    } | null>;
  };
}

/**
 * Prisma-backed AllocationRepository implementation.
 */
export class PrismaAllocationRepository implements AllocationRepository {
  constructor(private readonly prisma: PrismaAllocationClient) {}

  public async findByTradeCaseId(tradeCaseId: string): Promise<readonly AllocationImportDto[]> {
    const results = await this.prisma.currencyRequest.findMany({
      where: { tradeCaseId },
      orderBy: { approvedAt: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  public async findByAllocationNumber(allocationNumber: string): Promise<AllocationImportDto | null> {
    const result = await this.prisma.currencyRequest.findUnique({
      where: { requestNumber: allocationNumber },
    });

    if (!result) return null;

    return this.toDto(result);
  }

  public async findAll(limit?: number): Promise<readonly AllocationImportDto[]> {
    const results = await this.prisma.currencyRequest.findMany({
      take: limit,
      orderBy: { approvedAt: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  private toDto(row: {
    requestNumber: string | null;
    currencyCode: string;
    amount: number | string | null;
    approvedAt: Date | null;
  }): AllocationImportDto {
    return {
      allocationNumber: row.requestNumber,
      currency: row.currencyCode,
      amount: row.amount !== null ? Number(row.amount) : null,
      approvedAt: row.approvedAt ?? undefined,
    };
  }
}

export default PrismaAllocationRepository;