export interface RegistrationImportDto {
  readonly registrationNumber: string | null;
  readonly companyName: string | null;
  readonly status: string | null;
  readonly submittedAt?: Date;
}
