/**
 * A warning attached to a specific trade case within the import preview.
 * Extends the raw import warning with optional registration context.
 */
export interface PreviewWarning {
  /** Warning code identifying the type of warning. */
  readonly code: string;

  /** Human-readable warning message. */
  readonly message: string;

  /** Optional worksheet name where the warning originated. */
  readonly worksheet?: string;

  /** Optional column name where the warning originated. */
  readonly column?: string;

  /** Optional registration number this warning relates to. */
  readonly registrationNumber?: string;
}

export default PreviewWarning;