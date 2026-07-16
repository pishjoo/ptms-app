import type { OriginRepository } from '@/server/domain/repositories/origin-repository';
import type { OriginImportDto } from '@/server/import/dto/origin-import.dto';

/**
 * Minimal Prisma client shape consumed by the Origin repository.
 * Origin data is not directly stored in the current Prisma schema as a standalone model,
 * so we read from NTSWProcess metadata or fall back to an empty result.
 */
export interface PrismaOriginClient {
  ntswProcess: {
    findMany(args: {
      where?: { tradeCaseId?: string };
      take?: number;
      orderBy?: Record<string, string>;
    }): Promise<ReadonlyArray<{
      id: string;
      referenceNo: string | null;
      status: string;
      lastUpdatedAt: Date | null;
    }>>;
  };
}

/**
 * Prisma-backed OriginRepository implementation.
 * Maps NTSW process records to OriginImportDto (origin data is derived
 * from NTSW registration metadata in the current schema).
 */
export class PrismaOriginRepository implements OriginRepository {
  constructor(private readonly prisma: PrismaOriginClient) {}

  public async findByTradeCaseId(tradeCaseId: string): Promise<readonly OriginImportDto[]> {
    const results = await this.prisma.ntswProcess.findMany({
      where: { tradeCaseId },
      orderBy: { lastUpdatedAt: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  public async findAll(limit?: number): Promise<readonly OriginImportDto[]> {
    const results = await this.prisma.ntswProcess.findMany({
      take: limit,
      orderBy: { lastUpdatedAt: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  private toDto(row: {
    id: string;
    referenceNo: string | null;
    status: string;
    lastUpdatedAt: Date | null;
  }): OriginImportDto {
    return {
      registrationNumber: row.referenceNo,
      origin: null,
      amount: null,
      registeredAt: row.lastUpdatedAt ?? undefined,
    };
  }
}

export default PrismaOriginRepository;