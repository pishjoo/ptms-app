/**
 * Aggregate statistics for the entire import preview.
 */
export interface PreviewSummary {
  /** Number of uploaded files / worksheets. */
  readonly totalFiles: number;

  /** Number of unique registration numbers across all records. */
  readonly totalRegistrations: number;

  /** Count of records that will be newly inserted. */
  readonly newRecords: number;

  /** Count of records that will be updated. */
  readonly updatedRecords: number;

  /** Count of records that will be removed. */
  readonly removedRecords: number;

  /** Count of records that are unchanged. */
  readonly unchangedRecords: number;

  /** Total number of warnings across all trade cases. */
  readonly totalWarnings: number;

  /** Total number of errors across all trade cases. */
  readonly totalErrors: number;
}

export default PreviewSummary;