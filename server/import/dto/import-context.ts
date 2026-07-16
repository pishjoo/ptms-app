export interface ImportContext {
  readonly sourceName: string;
  readonly fileName?: string;
  readonly uploadId?: string;
  readonly metadata?: Record<string, string | number | boolean | null>;
}
