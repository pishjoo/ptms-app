export interface OriginImportDto {
  readonly registrationNumber?: string | null;
  readonly origin: string | null;
  readonly amount: number | null;
  readonly registeredAt?: Date;
}
