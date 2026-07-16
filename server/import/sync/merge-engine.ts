export interface ManualFieldPolicy<TRecord> {
  readonly manualFieldNames: readonly (keyof TRecord)[];
}

export class MergeEngine<TRecord extends Record<string, unknown>> {
  constructor(private readonly manualFieldPolicy: ManualFieldPolicy<TRecord> = { manualFieldNames: [] }) {}

  public merge(
    importedRecord: TRecord,
    existingRecord: TRecord,
  ): TRecord {
    const mergedRecord = { ...existingRecord } as TRecord;

    const manualFieldNames = this.manualFieldPolicy.manualFieldNames.map((field) => String(field));

    for (const [key, value] of Object.entries(importedRecord)) {
      if (manualFieldNames.includes(key)) {
        continue;
      }

      (mergedRecord as Record<string, unknown>)[key] = value;
    }

    return mergedRecord;
  }
}
