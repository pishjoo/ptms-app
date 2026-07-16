import type { ChangeSet } from './change-set';
import type { ChangeType } from './change-type';

export interface ExistingRecordLike {
  readonly id?: string | number | null;
}

export class ChangeDetector<TRecord extends ExistingRecordLike> {
  public detectChanges(
    importedRecords: readonly TRecord[],
    existingRecords: readonly TRecord[],
    options?: { readonly keySelector?: (record: TRecord) => string | number | null | undefined },
  ): ChangeSet<TRecord> {
    const keySelector = options?.keySelector ?? ((record) => record.id ?? null);
    const existingByKey = new Map<string, TRecord>();

    for (const record of existingRecords) {
      const key = keySelector(record);
      if (key !== null && key !== undefined) {
        existingByKey.set(String(key), record);
      }
    }

    const addedRecords: ChangeSet<TRecord>['addedRecords'] = [];
    const updatedRecords: ChangeSet<TRecord>['updatedRecords'] = [];
    const removedRecords: ChangeSet<TRecord>['removedRecords'] = [];
    const unchangedRecords: ChangeSet<TRecord>['unchangedRecords'] = [];

    const importedKeys = new Set<string>();

    for (const importedRecord of importedRecords) {
      const key = keySelector(importedRecord);
      const keyValue = key !== null && key !== undefined ? String(key) : null;

      if (keyValue === null) {
        addedRecords.push({ record: importedRecord, changeType: 'NEW' });
        continue;
      }

      importedKeys.add(keyValue);
      const existingRecord = existingByKey.get(keyValue);

      if (!existingRecord) {
        addedRecords.push({ record: importedRecord, changeType: 'NEW' });
        continue;
      }

      const changedFields = this.detectChangedFields(importedRecord, existingRecord);
      if (changedFields.length === 0) {
        unchangedRecords.push({ record: importedRecord, changeType: 'UNCHANGED' });
      } else {
        updatedRecords.push({
          record: importedRecord,
          previousRecord: existingRecord,
          changedFields,
          changeType: 'UPDATED',
        });
      }
    }

    for (const existingRecord of existingRecords) {
      const key = keySelector(existingRecord);
      const keyValue = key !== null && key !== undefined ? String(key) : null;

      if (keyValue !== null && !importedKeys.has(keyValue)) {
        removedRecords.push({ record: existingRecord, changeType: 'REMOVED' });
      }
    }

    return {
      addedRecords,
      updatedRecords,
      removedRecords,
      unchangedRecords,
    };
  }

  private detectChangedFields(importedRecord: TRecord, existingRecord: TRecord): string[] {
    const importedEntries = Object.entries(importedRecord as Record<string, unknown>);
    const existingEntries = Object.entries(existingRecord as Record<string, unknown>);
    const existingMap = new Map(existingEntries.map(([key, value]) => [key, value]));

    return importedEntries
      .filter(([key, value]) => {
        const existingValue = existingMap.get(key);
        return !this.isEqual(value, existingValue);
      })
      .map(([key]) => key);
  }

  private isEqual(left: unknown, right: unknown): boolean {
    if (left === right) {
      return true;
    }

    if (left === null || right === null) {
      return false;
    }

    if (left instanceof Date && right instanceof Date) {
      return left.getTime() === right.getTime();
    }

    return JSON.stringify(left) === JSON.stringify(right);
  }
}
