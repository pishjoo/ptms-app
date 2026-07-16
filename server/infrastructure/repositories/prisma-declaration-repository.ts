import type { DeclarationRepository } from '@/server/domain/repositories/declaration-repository';
import type { DeclarationImportDto } from '@/server/import/dto/declaration-import.dto';

/**
 * Minimal Prisma client shape consumed by the Declaration repository.
 */
export interface PrismaDeclarationClient {
  customsDeclaration: {
    findMany(args: {
      where?: { tradeCaseId?: string; declarationNumber?: string };
      take?: number;
      orderBy?: Record<string, string>;
    }): Promise<ReadonlyArray<{
      declarationNumber: string | null;
      status: string;
      declarationDate: Date | null;
    }>>;

    findUnique(args: {
      where: { declarationNumber: string };
    }): Promise<{
      declarationNumber: string | null;
      status: string;
      declarationDate: Date | null;
    } | null>;
  };
}

/**
 * Prisma-backed DeclarationRepository implementation.
 */
export class PrismaDeclarationRepository implements DeclarationRepository {
  constructor(private readonly prisma: PrismaDeclarationClient) {}

  public async findByTradeCaseId(tradeCaseId: string): Promise<readonly DeclarationImportDto[]> {
    const results = await this.prisma.customsDeclaration.findMany({
      where: { tradeCaseId },
      orderBy: { declarationDate: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  public async findByDeclarationNumber(declarationNumber: string): Promise<DeclarationImportDto | null> {
    const result = await this.prisma.customsDeclaration.findUnique({
      where: { declarationNumber },
    });

    if (!result) return null;

    return this.toDto(result);
  }

  public async findAll(limit?: number): Promise<readonly DeclarationImportDto[]> {
    const results = await this.prisma.customsDeclaration.findMany({
      take: limit,
      orderBy: { declarationDate: 'desc' },
    });

    return results.map((r) => this.toDto(r));
  }

  private toDto(row: {
    declarationNumber: string | null;
    status: string;
    declarationDate: Date | null;
  }): DeclarationImportDto {
    return {
      declarationNumber: row.declarationNumber,
      amount: null,
      declaredAt: row.declarationDate ?? undefined,
    };
  }
}

export default PrismaDeclarationRepository;