import type { TradeCaseAggregate } from '@/server/domain/trade-case/entities/trade-case-aggregate';
import type { RegistrationImportDto } from '@/server/import/dto/registration-import.dto';
import type { AllocationImportDto } from '@/server/import/dto/allocation-import.dto';
import type { OriginImportDto } from '@/server/import/dto/origin-import.dto';
import type { DeclarationImportDto } from '@/server/import/dto/declaration-import.dto';
import type { CommitmentImportDto } from '@/server/import/dto/commitment-import.dto';

export interface TradeCaseBuilderDependencies {
  readonly createId?: (registrationNumber: string | null) => string;
}

export interface TradeCaseBuilderInput {
  readonly registrations: readonly RegistrationImportDto[];
  readonly allocations: readonly AllocationImportDto[];
  readonly origins: readonly OriginImportDto[];
  readonly declarations: readonly DeclarationImportDto[];
  readonly commitments: readonly CommitmentImportDto[];
}

export class TradeCaseBuilder {
  constructor(private readonly dependencies: TradeCaseBuilderDependencies = {}) {}

  public build(input: TradeCaseBuilderInput): TradeCaseAggregate[] {
    const registrationsByNumber = new Map<string, RegistrationImportDto>();
    const registrationNumbers = new Set<string>();

    for (const registration of input.registrations) {
      if (registration.registrationNumber) {
        const normalized = registration.registrationNumber.trim();
        registrationsByNumber.set(normalized, registration);
        registrationNumbers.add(normalized);
      }
    }

    for (const allocation of input.allocations) {
      const registrationNumber = this.resolveRegistrationNumber(allocation as unknown as Record<string, unknown>, 'registrationNumber');
      if (registrationNumber) {
        registrationNumbers.add(registrationNumber);
      }
    }

    for (const origin of input.origins) {
      const registrationNumber = this.resolveRegistrationNumber(origin as unknown as Record<string, unknown>, 'registrationNumber');
      if (registrationNumber) {
        registrationNumbers.add(registrationNumber);
      }
    }

    for (const declaration of input.declarations) {
      const registrationNumber = this.resolveRegistrationNumber(declaration as unknown as Record<string, unknown>, 'registrationNumber');
      if (registrationNumber) {
        registrationNumbers.add(registrationNumber);
      }
    }

    for (const commitment of input.commitments) {
      const registrationNumber = this.resolveRegistrationNumber(commitment as unknown as Record<string, unknown>, 'registrationNumber');
      if (registrationNumber) {
        registrationNumbers.add(registrationNumber);
      }
    }

    const groupedAllocations = this.groupByRegistration(input.allocations, 'registrationNumber');
    const groupedOrigins = this.groupByRegistration(input.origins, 'registrationNumber');
    const groupedDeclarations = this.groupByRegistration(input.declarations, 'registrationNumber');
    const groupedCommitments = this.groupByRegistration(input.commitments, 'registrationNumber');

    const tradeCases = Array.from(registrationNumbers).map((registrationNumber) => {
      const registration = registrationsByNumber.get(registrationNumber) ?? null;
      const allocations = groupedAllocations.get(registrationNumber) ?? [];
      const origins = groupedOrigins.get(registrationNumber) ?? [];
      const declarations = groupedDeclarations.get(registrationNumber) ?? [];
      const commitments = groupedCommitments.get(registrationNumber) ?? [];

      const approvedAllocation = this.sumNumbers(allocations.map((item) => (item as AllocationImportDto).amount));
      const registeredOrigin = this.sumNumbers(origins.map((item) => (item as OriginImportDto).amount));
      const declaredAmount = this.sumNumbers(declarations.map((item) => (item as DeclarationImportDto).amount));
      const commitmentCleared = this.sumNumbers(commitments.map((item) => (item as CommitmentImportDto).amount));

      return {
        id: this.dependencies.createId?.(registrationNumber) ?? `trade-case-${registrationNumber}`,
        registrationNumber,
        companyName: registration?.companyName ?? 'Unknown company',
        status: registration?.status ?? 'PENDING',
        lastActivityAt: registration?.submittedAt ?? null,
        assignedUser: null,
        approvedAllocation,
        remainingAllocation: Math.max(0, approvedAllocation),
        registeredOrigin,
        remainingOrigin: Math.max(0, registeredOrigin),
        declaredAmount,
        remainingDeclaration: Math.max(0, declaredAmount),
        commitmentCleared,
        remainingCommitment: Math.max(0, commitmentCleared),
        registration,
        allocations,
        origins,
        declarations,
        commitments,
      } satisfies TradeCaseAggregate;
    });

    return tradeCases;
  }

  private groupByRegistration<TRecord extends object>(
    records: readonly TRecord[],
    keyField?: keyof TRecord,
  ): Map<string, TRecord[]> {
    const grouped = new Map<string, TRecord[]>();

    for (const record of records) {
      const registrationNumber = this.resolveRegistrationNumber(record as Record<string, unknown>, keyField as string | undefined);

      if (!registrationNumber) {
        continue;
      }

      const bucket = grouped.get(registrationNumber) ?? [];
      bucket.push(record);
      grouped.set(registrationNumber, bucket);
    }

    return grouped;
  }

  private resolveRegistrationNumber(record: Record<string, unknown>, keyField?: string): string | undefined {
    const candidates: unknown[] = [
      record.registrationNumber,
      record.registrationNo,
      record.registration,
      record.referenceNo,
      record.referenceNumber,
    ];

    if (keyField) {
      candidates.unshift(record[keyField]);
    }

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return undefined;
  }

  private sumNumbers(values: readonly (number | null | undefined)[]): number {
    return values.reduce<number>((total, value) => total + (typeof value === 'number' ? value : 0), 0);
  }
}

export default TradeCaseBuilder;
