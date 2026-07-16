export interface ImportWarning {
  readonly code: string;
  readonly message: string;
  readonly worksheet?: string;
  readonly column?: string;
}
