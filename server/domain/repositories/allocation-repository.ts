import type { AllocationImportDto } from '@/server/import/dto/allocation-import.dto';

/**
 * Repository interface for Currency Allocation data.
 */
export interface AllocationRepository {
  /**
   * Find all allocations for a given trade case.
   */
  findByTradeCaseId(tradeCaseId: string): Promise<readonly AllocationImportDto[]>;

  /**
   * Find an allocation by its allocation number.
   */
  findByAllocationNumber(allocationNumber: string): Promise<AllocationImportDto | null>;

  /**
   * Return all allocations, optionally limited.
   */
  findAll(limit?: number): Promise<readonly AllocationImportDto[]>;
}

export default AllocationRepository;