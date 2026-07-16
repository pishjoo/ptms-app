import type {
  ImportSession,
  ImportSessionStatus,
  ImportedFile,
  ImportStatistics,
  ImportHistoryEntry,
  ImportHistoryEventType,
  ImportMetadata,
  ImportSessionRepository,
} from '@/server/domain/import-session';

/**
 * Application service for managing Import Session lifecycle.
 *
 * This service sits between the import pipeline and the persistence layer
 * (which will be added later). It currently:
 *   - Creates sessions and records them in the repository
 *   - Provides queries for session lookup and comparison
 *   - Records history events for audit purposes
 *   - Supports future re-import, rollback, and comparison workflows
 *
 * All dependencies are injected via the constructor (Dependency Injection only).
 * No Prisma, no database writes, no API routes, no UI.
 */
export class ImportSessionService {
  /**
   * @param repository - The import session repository implementation.
   *                     In-memory or Prisma-based implementations can be injected.
   */
  constructor(private readonly repository: ImportSessionRepository) {}

  // ---------------------------------------------------------------------------
  // Session Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Create a new Import Session.
   *
   * This records the beginning of an import operation. The session is created
   * in PENDING status and a SESSION_CREATED history entry is recorded.
   *
   * @param label - A human-readable label for the session.
   * @param sourceName - The source system (e.g. "NTSW").
   * @param previousSessionId - Optional reference to a previous session (for re-import).
   * @param metadata - Optional key-value metadata to attach.
   * @returns The newly created ImportSession.
   */
  public async createSession(
    label: string,
    sourceName: string,
    previousSessionId: string | null = null,
    metadata: readonly { key: string; value: string; description?: string | null }[] = [],
  ): Promise<ImportSession> {
    const now = new Date();
    const sessionId = this.generateId();

    const historyEntry: ImportHistoryEntry = {
      id: this.generateId(),
      sessionId,
      eventType: 'SESSION_CREATED',
      description: `Import session "${label}" created from source "${sourceName}".`,
      relatedSessionId: previousSessionId,
      details: null,
      createdAt: now,
    };

    const session: ImportSession = {
      id: sessionId,
      label,
      status: 'PENDING',
      sourceName,
      previousSessionId,
      files: [],
      statistics: {
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
        warningCount: 0,
        errorCount: 0,
        newRecordCount: 0,
        updatedRecordCount: 0,
        removedRecordCount: 0,
        unchangedRecordCount: 0,
      },
      historyEntries: [historyEntry],
      metadata: metadata.map((m) => ({
        id: this.generateId(),
        sessionId,
        key: m.key,
        value: m.value,
        description: m.description ?? null,
        createdAt: now,
      })),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    return this.repository.create(session);
  }

  /**
   * Update the status of a session and record the transition in history.
   *
   * @param sessionId - The ID of the session to update.
   * @param status - The new status.
   * @param description - A description of why the status changed.
   * @param details - Optional JSON-serializable details.
   * @returns The updated ImportSession, or null if the session was not found.
   */
  public async transitionStatus(
    sessionId: string,
    status: ImportSessionStatus,
    description: string,
    details: Readonly<Record<string, unknown>> | null = null,
  ): Promise<ImportSession | null> {
    const session = await this.repository.findById(sessionId);
    if (!session) return null;

    const now = new Date();
    const historyEntry: ImportHistoryEntry = {
      id: this.generateId(),
      sessionId,
      eventType: this.mapStatusToEventType(status),
      description,
      relatedSessionId: null,
      details,
      createdAt: now,
    };

    await this.repository.addHistoryEntry(sessionId, historyEntry);

    const updatedSession: ImportSession = {
      ...session,
      status,
      updatedAt: now,
      completedAt: status === 'COMPLETED' || status === 'FAILED' ? now : session.completedAt,
      historyEntries: [...session.historyEntries, historyEntry],
    };

    return this.repository.update(updatedSession);
  }

  /**
   * Record the files detected during an import operation against a session.
   *
   * @param sessionId - The ID of the session.
   * @param files - The list of detected files with their metadata.
   * @returns The updated ImportSession, or null if the session was not found.
   */
  public async recordFiles(
    sessionId: string,
    files: readonly {
      detectedFileType: ImportedFile['detectedFileType'];
      originalFilename: string;
      workbookHash: string;
      rowCount: number;
      warningCount: number;
      errorCount: number;
    }[],
  ): Promise<ImportSession | null> {
    const session = await this.repository.findById(sessionId);
    if (!session) return null;

    const now = new Date();
    const importedFiles: ImportedFile[] = files.map((f) => ({
      id: this.generateId(),
      sessionId,
      detectedFileType: f.detectedFileType,
      originalFilename: f.originalFilename,
      workbookHash: f.workbookHash,
      rowCount: f.rowCount,
      warningCount: f.warningCount,
      errorCount: f.errorCount,
      createdAt: now,
    }));

    const updatedSession: ImportSession = {
      ...session,
      files: [...session.files, ...importedFiles],
      updatedAt: now,
    };

    return this.repository.update(updatedSession);
  }

  /**
   * Update the statistics of a session.
   *
   * @param sessionId - The ID of the session.
   * @param statistics - The new statistics.
   * @returns The updated ImportSession, or null if the session was not found.
   */
  public async updateStatistics(
    sessionId: string,
    statistics: ImportStatistics,
  ): Promise<ImportSession | null> {
    const session = await this.repository.findById(sessionId);
    if (!session) return null;

    const updatedSession: ImportSession = {
      ...session,
      statistics,
      updatedAt: new Date(),
    };

    return this.repository.update(updatedSession);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Find a session by its ID.
   */
  public async findSessionById(id: string): Promise<ImportSession | null> {
    return this.repository.findById(id);
  }

  /**
   * Find all sessions from a given source.
   */
  public async findSessionsBySource(sourceName: string): Promise<readonly ImportSession[]> {
    return this.repository.findBySource(sourceName);
  }

  /**
   * Find all sessions with a given status.
   */
  public async findSessionsByStatus(status: ImportSessionStatus): Promise<readonly ImportSession[]> {
    return this.repository.findByStatus(status);
  }

  /**
   * Find sessions within a date range.
   */
  public async findSessionsByDateRange(start: Date, end: Date): Promise<readonly ImportSession[]> {
    return this.repository.findByDateRange(start, end);
  }

  /**
   * Get the most recent session for a source.
   */
  public async findLatestSessionBySource(sourceName: string): Promise<ImportSession | null> {
    return this.repository.findLatestBySource(sourceName);
  }

  /**
   * List all sessions.
   */
  public async findAllSessions(): Promise<readonly ImportSession[]> {
    return this.repository.findAll();
  }

  // ---------------------------------------------------------------------------
  // Re-import Support
  // ---------------------------------------------------------------------------

  /**
   * Compare two sessions by their file hashes to determine what changed.
   *
   * Supports the future re-import workflow by identifying which files are
   * new, unchanged, modified, or removed compared to a previous session.
   *
   * @param currentSessionId - The new session.
   * @param previousSessionId - The previous session to compare against.
   * @returns A comparison result describing the differences, or null if either
   *          session is not found.
   */
  public async compareSessions(
    currentSessionId: string,
    previousSessionId: string,
  ): Promise<{
    newFiles: readonly ImportedFile[];
    unchangedFiles: readonly ImportedFile[];
    modifiedFiles: readonly ImportedFile[];
    removedFiles: readonly ImportedFile[];
  } | null> {
    const [current, previous] = await Promise.all([
      this.repository.findById(currentSessionId),
      this.repository.findById(previousSessionId),
    ]);

    if (!current || !previous) return null;

    const currentHashes = new Map<string, ImportedFile>();
    for (const file of current.files) {
      currentHashes.set(file.workbookHash, file);
    }

    const previousHashes = new Map<string, ImportedFile>();
    for (const file of previous.files) {
      previousHashes.set(file.workbookHash, file);
    }

    const newFiles: ImportedFile[] = [];
    const unchangedFiles: ImportedFile[] = [];
    const modifiedFiles: ImportedFile[] = [];
    const removedFiles: ImportedFile[] = [];

    // Files in current but not in previous = new
    // Files in current and in previous with same hash = unchanged
    for (const [hash, file] of currentHashes) {
      if (previousHashes.has(hash)) {
        unchangedFiles.push(file);
      } else {
        // Check if a file of the same type exists (modified)
        const sameTypePrev = Array.from(previousHashes.values()).find(
          (pf) => pf.detectedFileType === file.detectedFileType,
        );
        if (sameTypePrev) {
          modifiedFiles.push(file);
        } else {
          newFiles.push(file);
        }
      }
    }

    // Files in previous but not in current = removed
    for (const [hash, file] of previousHashes) {
      if (!currentHashes.has(hash)) {
        removedFiles.push(file);
      }
    }

    // Record the comparison in history
    await this.addHistoryEntry(
      currentSessionId,
      'COMPARED',
      `Compared session "${currentSessionId}" with previous session "${previousSessionId}".`,
      {
        previousSessionId,
        newFileCount: newFiles.length,
        unchangedFileCount: unchangedFiles.length,
        modifiedFileCount: modifiedFiles.length,
        removedFileCount: removedFiles.length,
      },
    );

    return { newFiles, unchangedFiles, modifiedFiles, removedFiles };
  }

  /**
   * Rollback a session by marking it as ROLLED_BACK.
   *
   * The actual data reversal will be handled by the persistence layer when
   * it is implemented.
   *
   * @param sessionId - The session to roll back.
   * @param reason - The reason for the rollback.
   * @returns The updated session, or null if not found.
   */
  public async rollbackSession(
    sessionId: string,
    reason: string,
  ): Promise<ImportSession | null> {
    return this.transitionStatus(sessionId, 'ROLLED_BACK', reason, { reason });
  }

  // ---------------------------------------------------------------------------
  // History helpers
  // ---------------------------------------------------------------------------

  /**
   * Add a history entry to a session.
   */
  public async addHistoryEntry(
    sessionId: string,
    eventType: ImportHistoryEventType,
    description: string,
    details: Readonly<Record<string, unknown>> | null = null,
  ): Promise<void> {
    const entry: ImportHistoryEntry = {
      id: this.generateId(),
      sessionId,
      eventType,
      description,
      relatedSessionId: null,
      details,
      createdAt: new Date(),
    };
    await this.repository.addHistoryEntry(sessionId, entry);
  }

  /**
   * Get the full audit history for a session.
   */
  public async getHistory(sessionId: string): Promise<readonly ImportHistoryEntry[]> {
    return this.repository.findHistoryBySessionId(sessionId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Map an ImportSessionStatus to the corresponding ImportHistoryEventType.
   */
  private mapStatusToEventType(status: ImportSessionStatus): ImportHistoryEventType {
    switch (status) {
      case 'PENDING':
        return 'SESSION_CREATED';
      case 'IMPORTING':
        return 'IMPORT_STARTED';
      case 'COMPLETED':
        return 'IMPORT_COMPLETED';
      case 'FAILED':
        return 'IMPORT_FAILED';
      case 'ROLLED_BACK':
        return 'ROLLED_BACK';
      case 'ARCHIVED':
        return 'ARCHIVED';
    }
  }

  /**
   * Generate a unique identifier.
   *
   * Uses a simple UUID-like format. When the persistence layer is added, the
   * database will be the source of truth for IDs.
   */
  private generateId(): string {
    return `ims_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export default ImportSessionService;