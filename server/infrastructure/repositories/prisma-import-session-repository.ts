import type { ImportSessionRepository } from '@/server/domain/import-session/repositories/import-session-repository';
import type { ImportSession, ImportSessionStatus } from '@/server/domain/import-session/entities/import-session';
import type { ImportedFile } from '@/server/domain/import-session/entities/imported-file';
import type { ImportHistoryEntry } from '@/server/domain/import-session/entities/import-history';
import type { ImportMetadata } from '@/server/domain/import-session/entities/import-metadata';
import type { ImportStatistics } from '@/server/domain/import-session/entities/import-statistics';

/**
 * Minimal Prisma client shape consumed by the ImportSession repository.
 *
 * Since the Prisma schema does not contain ImportSession-related models,
 * this repository uses raw SQL queries ($queryRaw / $executeRaw) to persist
 * session data. The interface is defined to keep the pattern consistent
 * with other Prisma repositories in the codebase.
 */
export interface PrismaImportSessionClient {
  $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<number>;
}

// ---------------------------------------------------------------------------
// Internal row shapes for raw SQL result mapping
// ---------------------------------------------------------------------------

interface SessionRow {
  id: string;
  label: string;
  status: string;
  sourceName: string;
  previousSessionId: string | null;
  statistics: string; // JSON blob
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

interface FileRow {
  id: string;
  sessionId: string;
  detectedFileType: string;
  originalFilename: string;
  workbookHash: string;
  rowCount: number;
  warningCount: number;
  errorCount: number;
  createdAt: Date;
}

interface HistoryRow {
  id: string;
  sessionId: string;
  eventType: string;
  description: string;
  relatedSessionId: string | null;
  details: string | null; // JSON blob
  createdAt: Date;
}

interface MetadataRow {
  id: string;
  sessionId: string;
  key: string;
  value: string;
  description: string | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------------------

/**
 * Prisma-backed ImportSessionRepository implementation.
 *
 * Uses raw SQL queries because the Prisma schema does not include
 * ImportSession-related models. This keeps persistence logic inside
 * the infrastructure layer without modifying the schema.
 *
 * Session data is stored in dedicated tables expected to be created
 * by a future migration. For development/testing, the tables can be
 * created manually or via the db/setup.sql script.
 */
export class PrismaImportSessionRepository implements ImportSessionRepository {
  constructor(private readonly prisma: PrismaImportSessionClient) {}

  // ---------------------------------------------------------------------------
  // Session CRUD
  // ---------------------------------------------------------------------------

  public async create(session: ImportSession): Promise<ImportSession> {
    // Insert the session row
    await this.prisma.$executeRaw`
      INSERT INTO "ImportSession" (
        id, label, status, "sourceName", "previousSessionId",
        statistics, "createdAt", "updatedAt", "completedAt"
      ) VALUES (
        ${session.id}, ${session.label}, ${session.status}, ${session.sourceName},
        ${session.previousSessionId}, ${JSON.stringify(session.statistics)},
        ${session.createdAt}, ${session.updatedAt}, ${session.completedAt}
      )
    `;

    // Insert files
    for (const file of session.files) {
      await this.prisma.$executeRaw`
        INSERT INTO "ImportedFile" (
          id, "sessionId", "detectedFileType", "originalFilename",
          "workbookHash", "rowCount", "warningCount", "errorCount", "createdAt"
        ) VALUES (
          ${file.id}, ${file.sessionId}, ${file.detectedFileType},
          ${file.originalFilename}, ${file.workbookHash},
          ${file.rowCount}, ${file.warningCount}, ${file.errorCount}, ${file.createdAt}
        )
      `;
    }

    // Insert history entries
    for (const entry of session.historyEntries) {
      await this.prisma.$executeRaw`
        INSERT INTO "ImportSessionHistory" (
          id, "sessionId", "eventType", description,
          "relatedSessionId", details, "createdAt"
        ) VALUES (
          ${entry.id}, ${entry.sessionId}, ${entry.eventType},
          ${entry.description}, ${entry.relatedSessionId},
          ${entry.details ? JSON.stringify(entry.details) : null}, ${entry.createdAt}
        )
      `;
    }

    // Insert metadata
    for (const meta of session.metadata) {
      await this.prisma.$executeRaw`
        INSERT INTO "ImportSessionMetadata" (
          id, "sessionId", key, value, description, "createdAt"
        ) VALUES (
          ${meta.id}, ${meta.sessionId}, ${meta.key}, ${meta.value},
          ${meta.description}, ${meta.createdAt}
        )
      `;
    }

    return session;
  }

  public async findById(id: string): Promise<ImportSession | null> {
    const rows = await this.prisma.$queryRaw<SessionRow[]>`
      SELECT * FROM "ImportSession" WHERE id = ${id}
    `;

    if (rows.length === 0) return null;

    return this.buildSession(rows[0]);
  }

  public async update(session: ImportSession): Promise<ImportSession> {
    await this.prisma.$executeRaw`
      UPDATE "ImportSession" SET
        label = ${session.label},
        status = ${session.status},
        "sourceName" = ${session.sourceName},
        "previousSessionId" = ${session.previousSessionId},
        statistics = ${JSON.stringify(session.statistics)},
        "updatedAt" = ${session.updatedAt},
        "completedAt" = ${session.completedAt}
      WHERE id = ${session.id}
    `;

    // Replace files (delete old, insert new)
    await this.prisma.$executeRaw`
      DELETE FROM "ImportedFile" WHERE "sessionId" = ${session.id}
    `;
    for (const file of session.files) {
      await this.prisma.$executeRaw`
        INSERT INTO "ImportedFile" (
          id, "sessionId", "detectedFileType", "originalFilename",
          "workbookHash", "rowCount", "warningCount", "errorCount", "createdAt"
        ) VALUES (
          ${file.id}, ${file.sessionId}, ${file.detectedFileType},
          ${file.originalFilename}, ${file.workbookHash},
          ${file.rowCount}, ${file.warningCount}, ${file.errorCount}, ${file.createdAt}
        )
      `;
    }

    // Replace metadata (delete old, insert new)
    await this.prisma.$executeRaw`
      DELETE FROM "ImportSessionMetadata" WHERE "sessionId" = ${session.id}
    `;
    for (const meta of session.metadata) {
      await this.prisma.$executeRaw`
        INSERT INTO "ImportSessionMetadata" (
          id, "sessionId", key, value, description, "createdAt"
        ) VALUES (
          ${meta.id}, ${meta.sessionId}, ${meta.key}, ${meta.value},
          ${meta.description}, ${meta.createdAt}
        )
      `;
    }

    return session;
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM "ImportedFile" WHERE "sessionId" = ${id}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "ImportSessionHistory" WHERE "sessionId" = ${id}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "ImportSessionMetadata" WHERE "sessionId" = ${id}
    `;
    await this.prisma.$executeRaw`
      DELETE FROM "ImportSession" WHERE id = ${id}
    `;
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  public async findByStatus(status: ImportSessionStatus): Promise<readonly ImportSession[]> {
    const rows = await this.prisma.$queryRaw<SessionRow[]>`
      SELECT * FROM "ImportSession" WHERE status = ${status}
      ORDER BY "createdAt" DESC
    `;
    return Promise.all(rows.map((r) => this.buildSession(r)));
  }

  public async findBySource(sourceName: string): Promise<readonly ImportSession[]> {
    const rows = await this.prisma.$queryRaw<SessionRow[]>`
      SELECT * FROM "ImportSession" WHERE "sourceName" = ${sourceName}
      ORDER BY "createdAt" DESC
    `;
    return Promise.all(rows.map((r) => this.buildSession(r)));
  }

  public async findByDateRange(start: Date, end: Date): Promise<readonly ImportSession[]> {
    const rows = await this.prisma.$queryRaw<SessionRow[]>`
      SELECT * FROM "ImportSession"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      ORDER BY "createdAt" DESC
    `;
    return Promise.all(rows.map((r) => this.buildSession(r)));
  }

  public async findLatestBySource(sourceName: string): Promise<ImportSession | null> {
    const rows = await this.prisma.$queryRaw<SessionRow[]>`
      SELECT * FROM "ImportSession"
      WHERE "sourceName" = ${sourceName}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    return this.buildSession(rows[0]);
  }

  public async findAll(): Promise<readonly ImportSession[]> {
    const rows = await this.prisma.$queryRaw<SessionRow[]>`
      SELECT * FROM "ImportSession" ORDER BY "createdAt" DESC
    `;
    return Promise.all(rows.map((r) => this.buildSession(r)));
  }

  // ---------------------------------------------------------------------------
  // File operations
  // ---------------------------------------------------------------------------

  public async findFileByHash(workbookHash: string): Promise<ImportedFile | null> {
    const rows = await this.prisma.$queryRaw<FileRow[]>`
      SELECT * FROM "ImportedFile" WHERE "workbookHash" = ${workbookHash}
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    return this.toFile(rows[0]);
  }

  public async findFilesBySessionId(sessionId: string): Promise<readonly ImportedFile[]> {
    const rows = await this.prisma.$queryRaw<FileRow[]>`
      SELECT * FROM "ImportedFile" WHERE "sessionId" = ${sessionId}
      ORDER BY "createdAt" ASC
    `;
    return rows.map((r) => this.toFile(r));
  }

  // ---------------------------------------------------------------------------
  // History operations
  // ---------------------------------------------------------------------------

  public async addHistoryEntry(sessionId: string, entry: ImportHistoryEntry): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO "ImportSessionHistory" (
        id, "sessionId", "eventType", description,
        "relatedSessionId", details, "createdAt"
      ) VALUES (
        ${entry.id}, ${entry.sessionId}, ${entry.eventType},
        ${entry.description}, ${entry.relatedSessionId},
        ${entry.details ? JSON.stringify(entry.details) : null}, ${entry.createdAt}
      )
    `;
  }

  public async findHistoryBySessionId(sessionId: string): Promise<readonly ImportHistoryEntry[]> {
    const rows = await this.prisma.$queryRaw<HistoryRow[]>`
      SELECT * FROM "ImportSessionHistory" WHERE "sessionId" = ${sessionId}
      ORDER BY "createdAt" ASC
    `;
    return rows.map((r) => this.toHistoryEntry(r));
  }

  // ---------------------------------------------------------------------------
  // Metadata operations
  // ---------------------------------------------------------------------------

  public async addMetadata(sessionId: string, metadata: readonly ImportMetadata[]): Promise<void> {
    for (const meta of metadata) {
      await this.prisma.$executeRaw`
        INSERT INTO "ImportSessionMetadata" (
          id, "sessionId", key, value, description, "createdAt"
        ) VALUES (
          ${meta.id}, ${meta.sessionId}, ${meta.key}, ${meta.value},
          ${meta.description}, ${meta.createdAt}
        )
      `;
    }
  }

  public async findMetadataBySessionId(sessionId: string): Promise<readonly ImportMetadata[]> {
    const rows = await this.prisma.$queryRaw<MetadataRow[]>`
      SELECT * FROM "ImportSessionMetadata" WHERE "sessionId" = ${sessionId}
      ORDER BY "createdAt" ASC
    `;
    return rows.map((r) => this.toMetadata(r));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async buildSession(row: SessionRow): Promise<ImportSession> {
    const [files, historyEntries, metadata] = await Promise.all([
      this.findFilesBySessionId(row.id),
      this.findHistoryBySessionId(row.id),
      this.findMetadataBySessionId(row.id),
    ]);

    return {
      id: row.id,
      label: row.label,
      status: row.status as ImportSessionStatus,
      sourceName: row.sourceName,
      previousSessionId: row.previousSessionId,
      files,
      statistics: this.parseStatistics(row.statistics),
      historyEntries,
      metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      completedAt: row.completedAt,
    };
  }

  private parseStatistics(json: string): ImportStatistics {
    try {
      return JSON.parse(json) as ImportStatistics;
    } catch {
      return {
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
        warningCount: 0,
        errorCount: 0,
        newRecordCount: 0,
        updatedRecordCount: 0,
        removedRecordCount: 0,
        unchangedRecordCount: 0,
      };
    }
  }

  private toFile(row: FileRow): ImportedFile {
    return {
      id: row.id,
      sessionId: row.sessionId,
      detectedFileType: row.detectedFileType as ImportedFile['detectedFileType'],
      originalFilename: row.originalFilename,
      workbookHash: row.workbookHash,
      rowCount: row.rowCount,
      warningCount: row.warningCount,
      errorCount: row.errorCount,
      createdAt: row.createdAt,
    };
  }

  private toHistoryEntry(row: HistoryRow): ImportHistoryEntry {
    return {
      id: row.id,
      sessionId: row.sessionId,
      eventType: row.eventType as ImportHistoryEntry['eventType'],
      description: row.description,
      relatedSessionId: row.relatedSessionId,
      details: row.details ? JSON.parse(row.details) : null,
      createdAt: row.createdAt,
    };
  }

  private toMetadata(row: MetadataRow): ImportMetadata {
    return {
      id: row.id,
      sessionId: row.sessionId,
      key: row.key,
      value: row.value,
      description: row.description,
      createdAt: row.createdAt,
    };
  }
}

export default PrismaImportSessionRepository;