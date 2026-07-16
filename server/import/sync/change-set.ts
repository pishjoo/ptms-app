import type { ChangeType } from './change-type';

export interface ChangeSet<TRecord> {
  readonly addedRecords: Array<{ readonly record: TRecord; readonly changeType: ChangeType }>;
  readonly updatedRecords: Array<{
    readonly record: TRecord;
    readonly previousRecord: TRecord;
    readonly changedFields: readonly string[];
    readonly changeType: ChangeType;
  }>;
  readonly removedRecords: Array<{ readonly record: TRecord; readonly changeType: ChangeType }>;
  readonly unchangedRecords: Array<{ readonly record: TRecord; readonly changeType: ChangeType }>;
}
