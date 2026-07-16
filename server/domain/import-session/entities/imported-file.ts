import type { FileProfileType } from '@/server/import/detection/file-profile';

/**
 * ImportedFile represents a single Excel file that was detected and processed
 * as part of an Import Session.
 *
 * Every file belongs to exactly one Import Session. The entity stores
 * detection and processing metadata required for future re-import, rollback,
 * comparison, and audit history.
 */
export interface ImportedFile {
  /** Unique identifier for this imported file record. */
  readonly id: string;

  /** The import session this file belongs to. */
  readonly sessionId: string;

  /** The detected file type (e.g. REGISTRATION_ORDER, CURRENCY_ALLOCATION). */
  readonly detectedFileType: FileProfileType;

  /** The original filename as uploaded. */
  readonly originalFilename: string;

  /**
   * SHA-256 hash of the workbook content.
   *
   * Used for change detection across imports: if the hash matches a previous
   * session's file, the system can skip re-processing or flag duplicates.
   *
   * Currently a placeholder; actual SHA-256 computation will be wired when
   * the persistence layer is added.
   */
  readonly workbookHash: string;

  /** Number of data rows detected in this file. */
  readonly rowCount: number;

  /** Number of warnings generated for this file. */
  readonly warningCount: number;

  /** Number of errors generated for this file. */
  readonly errorCount: number;

  /** Timestamp when this file record was created. */
  readonly createdAt: Date;
}

export default ImportedFile;