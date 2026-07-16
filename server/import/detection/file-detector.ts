import { HeaderMatcher } from './header-matcher';
import type { DetectionResult } from './detection-result';
import type { FileProfile } from './file-profile';
import { ProfileRegistry } from './profile-registry';

export interface WorkbookLike {
  readonly Sheets?: Record<string, unknown>;
}

export class FileDetector {
  constructor(
    private readonly profileRegistry: ProfileRegistry = new ProfileRegistry(),
    private readonly headerMatcher: HeaderMatcher = new HeaderMatcher(),
  ) {
    this.registerDefaultProfiles();
  }

  public detect(workbook: WorkbookLike): DetectionResult {
    const sheetNames = Object.keys(workbook.Sheets ?? {});

    if (sheetNames.length === 0) {
      return {
        detectedFileType: 'UNKNOWN',
        matchScore: 0,
        matchedColumns: [],
        missingRequiredColumns: [],
        warnings: ['Workbook contains no worksheets.'],
      };
    }

    const firstSheetName = sheetNames[0];
    const firstSheet = workbook.Sheets?.[firstSheetName];

    const headers = this.extractHeaders(firstSheet);

    let bestMatch: DetectionResult | undefined;

    for (const profile of this.profileRegistry.getProfiles()) {
      const match = this.headerMatcher.match(headers, profile);
      if (match.score >= profile.minimumMatchScore) {
        const candidate: DetectionResult = {
          detectedFileType: profile.type,
          matchScore: match.score,
          matchedColumns: match.matchedColumns,
          missingRequiredColumns: match.missingRequiredColumns,
          warnings: match.warnings,
        };

        if (!bestMatch || candidate.matchScore > bestMatch.matchScore) {
          bestMatch = candidate;
        }
      }
    }

    if (!bestMatch) {
      return {
        detectedFileType: 'UNKNOWN',
        matchScore: 0,
        matchedColumns: [],
        missingRequiredColumns: [],
        warnings: ['No registered profile met the minimum match threshold.'],
      };
    }

    return bestMatch;
  }

  public registerProfile(profile: FileProfile): void {
    this.profileRegistry.register(profile);
  }

  private registerDefaultProfiles(): void {
    const profiles: FileProfile[] = [
      {
        type: 'REGISTRATION_ORDER',
        requiredColumns: ['registration number', 'company name'],
        optionalColumns: ['status', 'submitted date'],
        forbiddenColumns: ['currency', 'commitment'],
        minimumMatchScore: 70,
        aliases: {
          'registration number': ['reg no', 'registration no', 'reg number'],
          'company name': ['company', 'customer', 'trader'],
          'status': ['workflow status'],
          'submitted date': ['registration date', 'date'],
        },
      },
      {
        type: 'CURRENCY_ALLOCATION',
        requiredColumns: ['allocation number', 'currency', 'amount'],
        optionalColumns: ['approved date'],
        forbiddenColumns: ['origin', 'declaration'],
        minimumMatchScore: 70,
        aliases: {
          'allocation number': ['allocation no', 'request no', 'request number'],
          'currency': ['currency code'],
          'amount': ['value'],
          'approved date': ['approved date', 'date'],
        },
      },
      {
        type: 'ORIGIN_REGISTRATION',
        requiredColumns: ['origin', 'amount'],
        optionalColumns: ['registered date'],
        forbiddenColumns: ['declaration', 'commitment'],
        minimumMatchScore: 70,
        aliases: {
          'origin': ['country of origin', 'country'],
          'amount': ['value'],
          'registered date': ['registration date', 'date'],
        },
      },
      {
        type: 'CUSTOMS_DECLARATION',
        requiredColumns: ['declaration number', 'amount'],
        optionalColumns: ['declared date'],
        forbiddenColumns: ['origin', 'commitment'],
        minimumMatchScore: 70,
        aliases: {
          'declaration number': ['declaration no', 'customs no'],
          'amount': ['value'],
          'declared date': ['declaration date', 'date'],
        },
      },
      {
        type: 'COMMITMENT_SETTLEMENT',
        requiredColumns: ['commitment number', 'amount'],
        optionalColumns: ['settled date'],
        forbiddenColumns: ['origin', 'declaration'],
        minimumMatchScore: 70,
        aliases: {
          'commitment number': ['commitment no', 'settlement no'],
          'amount': ['value'],
          'settled date': ['settlement date', 'date'],
        },
      },
    ];

    for (const profile of profiles) {
      this.registerProfile(profile);
    }
  }

  private extractHeaders(sheet: unknown): string[] {
    if (!sheet || typeof sheet !== 'object') {
      return [];
    }

    const sheetObject = sheet as Record<string, unknown>;
    const rows = sheetObject['!rows'];

    if (!Array.isArray(rows)) {
      return [];
    }

    if (rows.length === 0) {
      return [];
    }

    const firstRow = rows[0];
    if (!Array.isArray(firstRow)) {
      return [];
    }

    return firstRow.map((cell) => (cell && typeof cell === 'object' && 'v' in cell ? String((cell as { v?: unknown }).v ?? '') : String(cell ?? '')));
  }
}
