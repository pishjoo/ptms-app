export type FileProfileType =
  | 'REGISTRATION_ORDER'
  | 'CURRENCY_ALLOCATION'
  | 'ORIGIN_REGISTRATION'
  | 'CUSTOMS_DECLARATION'
  | 'COMMITMENT_SETTLEMENT'
  | 'UNKNOWN';

export interface FileProfile {
  readonly type: FileProfileType;
  readonly requiredColumns: readonly string[];
  readonly optionalColumns: readonly string[];
  readonly forbiddenColumns: readonly string[];
  readonly minimumMatchScore: number;
  readonly aliases?: Record<string, readonly string[]>;
}
