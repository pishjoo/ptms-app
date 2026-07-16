import type { RegistrationImportDto } from '@/server/import/dto/registration-import.dto';

/**
 * Repository interface for Registration Order data.
 */
export interface RegistrationRepository {
  /**
   * Find all registration orders for a given trade case.
   */
  findByTradeCaseId(tradeCaseId: string): Promise<readonly RegistrationImportDto[]>;

  /**
   * Find a registration order by its order number.
   */
  findByOrderNumber(orderNumber: string): Promise<RegistrationImportDto | null>;

  /**
   * Return all registration orders, optionally limited.
   */
  findAll(limit?: number): Promise<readonly RegistrationImportDto[]>;
}

export default RegistrationRepository;