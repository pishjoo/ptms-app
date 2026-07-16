import type { ImportWarning } from './import-warning';
import type { ImportError } from './import-error';
import type { ChangeSet } from '../sync/change-set';

export interface ChangeSummary {
  readonly newCount: number;
  readonly updatedCount: number;
  readonly removedCount: number;
  readonly unchangedCount: number;
}

export interface ImportPreview {
  readonly detectedFileType: string;
  readonly totalRows: number;
  readonly importedRows: number;
  readonly skippedRows: number;
  readonly warnings: ImportWarning[];
  readonly errors: ImportError[];
  readonly changeSummary: ChangeSummary;
  readonly changeSets: Record<string, ChangeSet<unknown>>;
}

export default ImportPreview;
