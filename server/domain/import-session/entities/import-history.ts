/**
 * ImportHistory records the lifecycle events of an Import Session.
 *
 * Each event describes a state transition (e.g. CREATED, IMPORTED, ROLLED_BACK,
 * RE_IMPORTED) and can be used to build a full audit trail of what happened to
 * a session and when.
 */
export type ImportHistoryEventType =
  | 'SESSION_CREATED'
  | 'IMPORT_STARTED'
  | 'IMPORT_COMPLETED'
  | 'IMPORT_FAILED'
  | 'ROLLED_BACK'
  | 'RE_IMPORTED'
  | 'COMPARED'
  | 'ARCHIVED';

/**
 * A single audit entry in the Import History for a specific session.
 */
export interface ImportHistoryEntry {
  /** Unique identifier for this history entry. */
  readonly id: string;

  /** The import session this entry belongs to. */
  readonly sessionId: string;

  /** The type of event that occurred. */
  readonly eventType: ImportHistoryEventType;

  /** A human-readable description of what happened. */
  readonly description: string;

  /** Optional reference to a related session (e.g. the previous session during re-import). */
  readonly relatedSessionId: string | null;

  /** Optional JSON-serialisable payload with event-specific details. */
  readonly details: Readonly<Record<string, unknown>> | null;

  /** Timestamp when this event occurred. */
  readonly createdAt: Date;
}

/**
 * Collection of ImportHistoryEntry records for a given session,
 * ordered chronologically.
 */
export interface ImportHistory {
  /** The session these entries belong to. */
  readonly sessionId: string;

  /** All history entries, ordered from oldest to newest. */
  readonly entries: readonly ImportHistoryEntry[];
}

export default ImportHistory;