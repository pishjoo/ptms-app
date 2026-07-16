import type { ImportContext } from './import-context';
import type { ImportError } from './import-error';
import type { ImportWarning } from './import-warning';

export interface ImportResult {
  readonly context: ImportContext;
  readonly success: boolean;
  readonly warnings: ImportWarning[];
  readonly errors: ImportError[];
  readonly discoveredWorksheets: Record<string, boolean>;
  readonly validatedWorksheets: string[];
}
