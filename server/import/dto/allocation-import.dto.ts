export interface AllocationImportDto {
  readonly registrationNumber?: string | null;
  readonly allocationNumber: string | null;
  readonly currency: string | null;
  readonly amount: number | null;
  readonly approvedAt?: Date;
}
