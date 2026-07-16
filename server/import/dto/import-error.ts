export interface ImportError {
  readonly code: string;
  readonly message: string;
  readonly worksheet?: string;
  readonly column?: string;
}
