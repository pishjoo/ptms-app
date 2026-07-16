/**
 * ImportMetadata represents additional contextual information attached to an
 * Import Session.
 *
 * This value object is immutable and carries key-value pairs that describe the
 * origin, purpose, or conditions of an import operation (e.g. source system
 * name, upload batch reference, user notes).
 */
export interface ImportMetadata {
  /** The unique identifier for this metadata entry. */
  readonly id: string;

  /** The import session this metadata belongs to. */
  readonly sessionId: string;

  /** The key of the metadata entry. */
  readonly key: string;

  /** The value of the metadata entry (string-coercible values only). */
  readonly value: string;

  /** Optional description of what this metadata entry represents. */
  readonly description: string | null;

  /** Timestamp when this metadata entry was created. */
  readonly createdAt: Date;
}

export default ImportMetadata;