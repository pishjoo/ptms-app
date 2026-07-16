import type { AllocationImportDto } from '@/server/import/dto/allocation-import.dto';
import type { CommitmentImportDto } from '@/server/import/dto/commitment-import.dto';
import type { DeclarationImportDto } from '@/server/import/dto/declaration-import.dto';
import type { OriginImportDto } from '@/server/import/dto/origin-import.dto';
import type { RegistrationImportDto } from '@/server/import/dto/registration-import.dto';

/**
 * Domain aggregate for a trade case used by the rules engine and analyzers.
 */
export interface TradeCaseAggregate {
  /**
   * Unique identifier of the trade case.
   */
  readonly id: string;

  /**
   * Registration number assigned to the trade case.
   */
  readonly registrationNumber: string | null;

  /**
   * Company name associated with the trade case.
   */
  readonly companyName: string;

  /**
   * Current workflow status for the trade case.
   */
  readonly status: string;

  /**
   * Last activity timestamp for the trade case.
   */
  readonly lastActivityAt: Date | null;

  /**
   * User currently assigned to the trade case.
   */
  readonly assignedUser: string | null;

  /**
   * Approved allocation amount for the trade case.
   */
  readonly approvedAllocation: number;

  /**
   * Remaining allocation amount for the trade case.
   */
  readonly remainingAllocation: number;

  /**
   * Registered origin amount for the trade case.
   */
  readonly registeredOrigin: number;

  /**
   * Remaining origin amount for the trade case.
   */
  readonly remainingOrigin: number;

  /**
   * Declared amount for the trade case.
   */
  readonly declaredAmount: number;

  /**
   * Remaining declaration amount for the trade case.
   */
  readonly remainingDeclaration: number;

  /**
   * Commitment cleared amount for the trade case.
   */
  readonly commitmentCleared: number;

  /**
   * Remaining commitment amount for the trade case.
   */
  readonly remainingCommitment: number;

  /**
   * Registration record reference used to build the aggregate.
   */
  readonly registration?: RegistrationImportDto | null;

  /**
   * Currency allocation references used to build the aggregate.
   */
  readonly allocations?: readonly AllocationImportDto[];

  /**
   * Origin registration references used to build the aggregate.
   */
  readonly origins?: readonly OriginImportDto[];

  /**
   * Customs declaration references used to build the aggregate.
   */
  readonly declarations?: readonly DeclarationImportDto[];

  /**
   * Commitment settlement references used to build the aggregate.
   */
  readonly commitments?: readonly CommitmentImportDto[];
}
