import type { RepositoryFactory } from '@/server/domain/repositories/repository-factory';
import type { TradeCaseRepository } from '@/server/domain/repositories/trade-case-repository';
import type { RegistrationRepository } from '@/server/domain/repositories/registration-repository';
import type { AllocationRepository } from '@/server/domain/repositories/allocation-repository';
import type { OriginRepository } from '@/server/domain/repositories/origin-repository';
import type { DeclarationRepository } from '@/server/domain/repositories/declaration-repository';
import type { CommitmentRepository } from '@/server/domain/repositories/commitment-repository';
import { PrismaTradeCaseRepository, type PrismaTradeCaseClient } from './prisma-trade-case-repository';
import { PrismaRegistrationRepository, type PrismaRegistrationClient } from './prisma-registration-repository';
import { PrismaAllocationRepository, type PrismaAllocationClient } from './prisma-allocation-repository';
import { PrismaOriginRepository, type PrismaOriginClient } from './prisma-origin-repository';
import { PrismaDeclarationRepository, type PrismaDeclarationClient } from './prisma-declaration-repository';
import { PrismaCommitmentRepository, type PrismaCommitmentClient } from './prisma-commitment-repository';

/**
 * Combined Prisma client that satisfies all repository client interfaces.
 * This allows a single Prisma instance to be passed to the factory.
 */
export type FullPrismaClient = PrismaTradeCaseClient & PrismaRegistrationClient & PrismaAllocationClient & PrismaOriginClient & PrismaDeclarationClient & PrismaCommitmentClient;

/**
 * Concrete factory that creates Prisma-backed repository instances.
 *
 * Application services receive a RepositoryFactory (via DI) and call
 * these create methods to obtain repository instances, keeping them
 * decoupled from the Prisma implementation.
 */
export class PrismaRepositoryFactory implements RepositoryFactory {
  private readonly tradeCaseRepo: TradeCaseRepository;
  private readonly registrationRepo: RegistrationRepository;
  private readonly allocationRepo: AllocationRepository;
  private readonly originRepo: OriginRepository;
  private readonly declarationRepo: DeclarationRepository;
  private readonly commitmentRepo: CommitmentRepository;

  constructor(prisma: FullPrismaClient) {
    this.tradeCaseRepo = new PrismaTradeCaseRepository(prisma);
    this.registrationRepo = new PrismaRegistrationRepository(prisma);
    this.allocationRepo = new PrismaAllocationRepository(prisma);
    this.originRepo = new PrismaOriginRepository(prisma);
    this.declarationRepo = new PrismaDeclarationRepository(prisma);
    this.commitmentRepo = new PrismaCommitmentRepository(prisma);
  }

  public createTradeCaseRepository(): TradeCaseRepository {
    return this.tradeCaseRepo;
  }

  public createRegistrationRepository(): RegistrationRepository {
    return this.registrationRepo;
  }

  public createAllocationRepository(): AllocationRepository {
    return this.allocationRepo;
  }

  public createOriginRepository(): OriginRepository {
    return this.originRepo;
  }

  public createDeclarationRepository(): DeclarationRepository {
    return this.declarationRepo;
  }

  public createCommitmentRepository(): CommitmentRepository {
    return this.commitmentRepo;
  }
}

export default PrismaRepositoryFactory;