import type { DeclarationImportDto } from '@/server/import/dto/declaration-import.dto';

/**
 * Repository interface for Customs Declaration data.
 */
export interface DeclarationRepository {
  /**
   * Find all declarations for a given trade case.
   */
  findByTradeCaseId(tradeCaseId: string): Promise<readonly DeclarationImportDto[]>;

  /**
   * Find a declaration by its declaration number.
   */
  findByDeclarationNumber(declarationNumber: string): Promise<DeclarationImportDto | null>;

  /**
   * Return all declarations, optionally limited.
   */
  findAll(limit?: number): Promise<readonly DeclarationImportDto[]>;
}

export default DeclarationRepository;