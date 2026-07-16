import type { FileProfileType } from './file-profile';

export interface DetectionResult {
  readonly detectedFileType: FileProfileType;
  readonly matchScore: number;
  readonly matchedColumns: string[];
  readonly missingRequiredColumns: string[];
  readonly warnings: string[];
}
