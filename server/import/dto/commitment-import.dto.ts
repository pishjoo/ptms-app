export interface CommitmentImportDto {
  readonly registrationNumber?: string | null;
  readonly commitmentNumber: string | null;
  readonly amount: number | null;
  readonly settledAt?: Date;
}
