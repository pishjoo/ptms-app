import type { ChangeType } from '@/server/import/sync/change-type';
import type { PreviewChange } from './preview-change';

/**
 * A single record in the import preview.
 * Represents one data row that was detected as new, updated, removed, or unchanged.
 */
export interface PreviewItem {
  /** The kind of change detected for this record. */
  readonly changeType: ChangeType;

  /** The worksheet / sheet type this record belongs to (e.g. "Registration Orders"). */
  readonly sourceSheet: string;

  /** The raw record data (the full row object from the mapper). */
  readonly record: Record<string, unknown>;

  /** The previous version of the record when changeType is 'UPDATED' -- null otherwise. */
  readonly previousRecord: Record<string, unknown> | null;

  /** Field-level changes for updated records; empty for new / unchanged / removed records. */
  readonly changes: readonly PreviewChange[];

  /** Names of the fields that actually changed (only populated for UPDATED). */
  readonly changedFieldNames: readonly string[];
}

export default PreviewItem;