import type { TradeCaseAggregate } from '@/server/domain/trade-case/entities/trade-case-aggregate';

/**
 * Repository interface for Trade Case aggregates.
 *
 * Hides the underlying data-access mechanism (Prisma) behind this interface.
 * All methods return domain-safe TradeCaseAggregate objects.
 */
export interface TradeCaseRepository {
  /**
   * Persist a new trade case.
   */
  create(tradeCase: TradeCaseAggregate): Promise<TradeCaseAggregate>;

  /**
   * Update an existing trade case.
   */
  update(tradeCase: TradeCaseAggregate): Promise<TradeCaseAggregate>;

  /**
   * Find a single trade case by its internal ID.
   */
  findById(id: string): Promise<TradeCaseAggregate | null>;

  /**
   * Find a single trade case by its registration number.
   */
  findByRegistrationNumber(registrationNumber: string): Promise<TradeCaseAggregate | null>;

  /**
   * Return all trade cases, optionally limited.
   */
  findAll(limit?: number): Promise<readonly TradeCaseAggregate[]>;

  /**
   * Return trade cases belonging to a specific company.
   */
  findByCompanyId(companyId: string, limit?: number): Promise<readonly TradeCaseAggregate[]>;
}

export default TradeCaseRepository;