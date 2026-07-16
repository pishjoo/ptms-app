import type { ChangeType } from '@/server/import/sync/change-type';

/**
 * Represents a single changed field within an imported record.
 * Carries the old and new values together with the change type and originating sheet name.
 */
export interface PreviewChange {
  /** The logical worksheet name (e.g. "Registration Orders", "Currency Allocation"). */
  readonly sourceSheet: string;

  /** The name of the field that changed. */
  readonly fieldName: string;

  /** The value before the import (null for newly added records). */
  readonly oldValue: string | number | boolean | Date | null;

  /** The value after the import (null for removed records). */
  readonly newValue: string | number | boolean | Date | null;

  /** The kind of change that was detected. */
  readonly changeType: ChangeType;
}

export default PreviewChange;