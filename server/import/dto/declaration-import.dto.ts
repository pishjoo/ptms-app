export interface DeclarationImportDto {
  readonly registrationNumber?: string | null;
  readonly declarationNumber: string | null;
  readonly amount: number | null;
  readonly declaredAt?: Date;
}
