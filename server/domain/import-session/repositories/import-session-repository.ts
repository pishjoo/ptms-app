import type { ImportSession } from '../entities/import-session';
import type { ImportSessionStatus } from '../entities/import-session';
import type { ImportedFile } from '../entities/imported-file';
import type { ImportHistoryEntry } from '../entities/import-history';
import type { ImportMetadata } from '../entities/import-metadata';

/**
 * Repository interface for Import Session persistence.
 *
 * This interface follows the existing repository pattern used throughout PTMS
 * (see server/domain/repositories/). Implementations will be provided by the
 * infrastructure layer when persistence is added.
 *
 * The interface supports all operations needed for:
 *   - CRUD on ImportSession aggregates
 *   - Querying sessions by status, source, or time range
 *   - Finding sessions by file hash (for duplicate detection)
 *   - Managing the session's child entities (files, history, metadata)
 */
export interface ImportSessionRepository {
  // ---------------------------------------------------------------------------
  // Session CRUD
  // ---------------------------------------------------------------------------

  /** Persist a new Import Session. */
  create(session: ImportSession): Promise<ImportSession>;

  /** Retrieve a session by its unique identifier. Returns null if not found. */
  findById(id: string): Promise<ImportSession | null>;

  /** Update an existing session's mutable fields (status, statistics, timestamps). */
  update(session: ImportSession): Promise<ImportSession>;

  /** Delete a session and all its associated child records. */
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** Find all sessions with a given status. */
  findByStatus(status: ImportSessionStatus): Promise<readonly ImportSession[]>;

  /** Find all sessions from a given source, ordered by creation date descending. */
  findBySource(sourceName: string): Promise<readonly ImportSession[]>;

  /** Find sessions created within a date range. */
  findByDateRange(start: Date, end: Date): Promise<readonly ImportSession[]>;

  /** Find the most recent session for a given source. Returns null if none exist. */
  findLatestBySource(sourceName: string): Promise<ImportSession | null>;

  /** Find all sessions, ordered by creation date descending. */
  findAll(): Promise<readonly ImportSession[]>;

  // ---------------------------------------------------------------------------
  // File operations
  // ---------------------------------------------------------------------------

  /** Find a file by its workbook hash across all sessions. Used for duplicate detection. */
  findFileByHash(workbookHash: string): Promise<ImportedFile | null>;

  /** Find all files belonging to a specific session. */
  findFilesBySessionId(sessionId: string): Promise<readonly ImportedFile[]>;

  // ---------------------------------------------------------------------------
  // History operations
  // ---------------------------------------------------------------------------

  /** Add a history entry to a session. */
  addHistoryEntry(sessionId: string, entry: ImportHistoryEntry): Promise<void>;

  /** Retrieve all history entries for a session, ordered chronologically. */
  findHistoryBySessionId(sessionId: string): Promise<readonly ImportHistoryEntry[]>;

  // ---------------------------------------------------------------------------
  // Metadata operations
  // ---------------------------------------------------------------------------

  /** Add metadata entries to a session. */
  addMetadata(sessionId: string, metadata: readonly ImportMetadata[]): Promise<void>;

  /** Retrieve all metadata for a session. */
  findMetadataBySessionId(sessionId: string): Promise<readonly ImportMetadata[]>;
}

export default ImportSessionRepository;