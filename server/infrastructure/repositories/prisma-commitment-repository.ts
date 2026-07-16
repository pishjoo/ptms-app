import type { CommitmentRepository } from '@/server/domain/repositories/commitment-repository';
import type { CommitmentImportDto } from '@/server/import/dto/commitment-import.dto';

/**
 * Minimal Prisma client shape consumed by the Commitment repository.
 * Commitment data is not directly stored as a standalone model in the current schema.
 * This repository serves as an adapter — it returns an empty result set by default
 * and provides the structure for future schema expansion.
 */
export interface PrismaCommitmentClient {
  // Commitment model placeholder — extend when schema adds a Commitment/Settlement model.
  // For now all methods return empty arrays.
}

/**
 * Prisma-backed CommitmentRepository implementation.
 *
 * The current Prisma schema does not include a dedicated Commitment/Settlement model.
 * This implementation returns empty results until the schema is extended.
 * The repository interface and structure are already in place for immediate activation.
 */
export class PrismaCommitmentRepository implements CommitmentRepository {
  constructor(private readonly _prisma: PrismaCommitmentClient) {}

  public async findByTradeCaseId(_tradeCaseId: string): Promise<readonly CommitmentImportDto[]> {
    return [];
  }

  public async findByCommitmentNumber(_commitmentNumber: string): Promise<CommitmentImportDto | null> {
    return null;
  }

  public async findAll(_limit?: number): Promise<readonly CommitmentImportDto[]> {
    return [];
  }
}

export default PrismaCommitmentRepository;