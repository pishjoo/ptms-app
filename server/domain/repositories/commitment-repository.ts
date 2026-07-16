import type { CommitmentImportDto } from '@/server/import/dto/commitment-import.dto';

/**
 * Repository interface for Commitment Settlement data.
 */
export interface CommitmentRepository {
  /**
   * Find all commitments for a given trade case.
   */
  findByTradeCaseId(tradeCaseId: string): Promise<readonly CommitmentImportDto[]>;

  /**
   * Find a commitment by its commitment number.
   */
  findByCommitmentNumber(commitmentNumber: string): Promise<CommitmentImportDto | null>;

  /**
   * Return all commitments, optionally limited.
   */
  findAll(limit?: number): Promise<readonly CommitmentImportDto[]>;
}

export default CommitmentRepository;