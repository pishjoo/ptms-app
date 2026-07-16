import type { RegistrationRepository } from '@/server/domain/repositories/registration-repository';
import type { RegistrationImportDto } from '@/server/import/dto/registration-import.dto';

/**
 * Minimal Prisma client shape consumed by the Registration repository.
 */
export interface PrismaRegistrationClient {
  registrationOrder: {
    findMany(args: {
      where?: { tradeCaseId?: string; orderNumber?: string };
      take?: number;
      orderBy?: Record<string, string>;
    }): Promise<ReadonlyArray<{
      orderNumber: string | null;
      status: string;
      submittedAt: Date | null;
      tradeCase?: { referenceNo?: string | null } | null;
    }>>;

    findUnique(args: {
      where: { orderNumber: string };
    }): Promise<{
      orderNumber: string | null;
      status: string;
      submittedAt: Date | null;
    } | null>;
  };
}

/**
 * Prisma-backed RegistrationRepository implementation.
 */
export class PrismaRegistrationRepository implements RegistrationRepository {
  constructor(private readonly prisma: PrismaRegistrationClient) {}

  public async findByTradeCaseId(tradeCaseId: string): Promise<readonly RegistrationImportDto[]> {
    const results = await this.prisma.registrationOrder.findMany({
      where: { tradeCaseId },
      orderBy: { submittedAt: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  public async findByOrderNumber(orderNumber: string): Promise<RegistrationImportDto | null> {
    const result = await this.prisma.registrationOrder.findUnique({
      where: { orderNumber },
    });

    if (!result) return null;

    return this.toDto(result);
  }

  public async findAll(limit?: number): Promise<readonly RegistrationImportDto[]> {
    const results = await this.prisma.registrationOrder.findMany({
      take: limit,
      orderBy: { submittedAt: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  private toDto(row: {
    orderNumber: string | null;
    status: string;
    submittedAt: Date | null;
  }): RegistrationImportDto {
    return {
      registrationNumber: row.orderNumber,
      companyName: null,
      status: row.status,
      submittedAt: row.submittedAt ?? undefined,
    };
  }
}

export default PrismaRegistrationRepository;