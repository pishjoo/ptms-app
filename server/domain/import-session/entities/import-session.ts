import type { ImportedFile } from './imported-file';
import type { ImportStatistics } from './import-statistics';
import type { ImportHistoryEntry } from './import-history';
import type { ImportMetadata } from './import-metadata';

/**
 * The current status of an Import Session.
 */
export type ImportSessionStatus =
  | 'PENDING'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'ARCHIVED';

/**
 * ImportSession is the root aggregate for a single upload operation from NTSW.
 *
 * It represents one "import operation" — the upload, detection, validation,
 * and (in future) persistence of one or more Excel files. Every detected file
 * belongs to exactly one Import Session.
 *
 * The aggregate supports:
 *   - **Re-import**: A new session can reference a previous session via
 *     `previousSessionId`, allowing the system to compare the two and detect
 *     changes.
 *   - **Rollback**: A session can be rolled back by changing its status to
 *     `ROLLED_BACK`, recording the event in the history.
 *   - **Comparison**: Sessions can be compared by loading two sessions and
 *     diffing their `files` collections by `workbookHash`.
 *   - **Audit history**: Every state transition is recorded in `historyEntries`.
 */
export interface ImportSession {
  /** Unique identifier for this import session. */
  readonly id: string;

  /** Human-readable label for the session (e.g. "NTSW Upload 2026-07-15"). */
  readonly label: string;

  /** Current status of the session. */
  readonly status: ImportSessionStatus;

  /** The source system that initiated the import (e.g. "NTSW"). */
  readonly sourceName: string;

  /** Optional reference to a previous session that was re-imported. */
  readonly previousSessionId: string | null;

  /** All files that were detected and processed in this session. */
  readonly files: readonly ImportedFile[];

  /** Statistical summary of the import operation. */
  readonly statistics: ImportStatistics;

  /** Audit trail of all events that occurred on this session. */
  readonly historyEntries: readonly ImportHistoryEntry[];

  /** Additional contextual metadata key-value pairs. */
  readonly metadata: readonly ImportMetadata[];

  /** Timestamp when the session was created (upload time). */
  readonly createdAt: Date;

  /** Timestamp when the session was last updated. */
  readonly updatedAt: Date;

  /** Optional timestamp when the session was completed. */
  readonly completedAt: Date | null;
}

export default ImportSession;