import type { OriginImportDto } from '@/server/import/dto/origin-import.dto';

/**
 * Repository interface for Origin Registration data.
 */
export interface OriginRepository {
  /**
   * Find all origin records for a given trade case.
   */
  findByTradeCaseId(tradeCaseId: string): Promise<readonly OriginImportDto[]>;

  /**
   * Return all origin records, optionally limited.
   */
  findAll(limit?: number): Promise<readonly OriginImportDto[]>;
}

export default OriginRepository;