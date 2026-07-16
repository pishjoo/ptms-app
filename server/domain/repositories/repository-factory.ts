import type { TradeCaseRepository } from './trade-case-repository';
import type { RegistrationRepository } from './registration-repository';
import type { AllocationRepository } from './allocation-repository';
import type { OriginRepository } from './origin-repository';
import type { DeclarationRepository } from './declaration-repository';
import type { CommitmentRepository } from './commitment-repository';

/**
 * Factory interface for creating repository instances.
 *
 * Application services depend on this factory rather than on concrete
 * Prisma implementations, keeping the architecture Clean-Architecture compliant.
 */
export interface RepositoryFactory {
  /** Create a TradeCaseRepository. */
  createTradeCaseRepository(): TradeCaseRepository;

  /** Create a RegistrationRepository. */
  createRegistrationRepository(): RegistrationRepository;

  /** Create an AllocationRepository. */
  createAllocationRepository(): AllocationRepository;

  /** Create an OriginRepository. */
  createOriginRepository(): OriginRepository;

  /** Create a DeclarationRepository. */
  createDeclarationRepository(): DeclarationRepository;

  /** Create a CommitmentRepository. */
  createCommitmentRepository(): CommitmentRepository;
}

export default RepositoryFactory;