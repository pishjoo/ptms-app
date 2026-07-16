/**
 * ImportStatistics captures quantitative metrics for an Import Session.
 *
 * This value object is immutable and provides a snapshot of the import
 * operation's outcome: how many rows were processed, how many warnings
 * and errors were raised, and how many records were added/updated/removed.
 */
export interface ImportStatistics {
  /** Total number of data rows detected in the uploaded file(s). */
  readonly totalRows: number;

  /** Number of rows successfully imported. */
  readonly importedRows: number;

  /** Number of rows skipped during import. */
  readonly skippedRows: number;

  /** Number of warnings generated during import. */
  readonly warningCount: number;

  /** Number of errors generated during import. */
  readonly errorCount: number;

  /** Number of new records created. */
  readonly newRecordCount: number;

  /** Number of existing records updated. */
  readonly updatedRecordCount: number;

  /** Number of records removed. */
  readonly removedRecordCount: number;

  /** Number of records that remained unchanged. */
  readonly unchangedRecordCount: number;
}

export default ImportStatistics;