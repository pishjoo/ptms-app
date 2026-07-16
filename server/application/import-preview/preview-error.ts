/**
 * An error attached to a specific trade case within the import preview.
 * Extends the raw import error with optional registration context.
 */
export interface PreviewError {
  /** Error code identifying the type of error. */
  readonly code: string;

  /** Human-readable error message. */
  readonly message: string;

  /** Optional worksheet name where the error originated. */
  readonly worksheet?: string;

  /** Optional column name where the error originated. */
  readonly column?: string;

  /** Optional registration number this error relates to. */
  readonly registrationNumber?: string;
}

export default PreviewError;