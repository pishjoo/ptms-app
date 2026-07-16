export interface HeaderMatchResult {
  readonly matchedColumns: string[];
  readonly missingRequiredColumns: string[];
  readonly score: number;
  readonly warnings: string[];
}

export class HeaderMatcher {
  public match(headers: readonly string[], profile: { readonly requiredColumns: readonly string[]; readonly optionalColumns: readonly string[]; readonly forbiddenColumns: readonly string[]; readonly aliases?: Record<string, readonly string[]>; }): HeaderMatchResult {
    const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
    const matchedColumns: string[] = [];
    const missingRequiredColumns: string[] = [];
    const warnings: string[] = [];

    for (const requiredColumn of profile.requiredColumns) {
      const resolved = this.resolveColumn(requiredColumn, normalizedHeaders, profile.aliases);
      if (resolved) {
        matchedColumns.push(requiredColumn);
      } else {
        missingRequiredColumns.push(requiredColumn);
      }
    }

    for (const optionalColumn of profile.optionalColumns) {
      const resolved = this.resolveColumn(optionalColumn, normalizedHeaders, profile.aliases);
      if (resolved) {
        matchedColumns.push(optionalColumn);
      }
    }

    for (const forbiddenColumn of profile.forbiddenColumns) {
      const resolved = this.resolveColumn(forbiddenColumn, normalizedHeaders, profile.aliases);
      if (resolved) {
        warnings.push(`Forbidden column detected: ${forbiddenColumn}`);
      }
    }

    const matchedCount = matchedColumns.length;
    const totalColumns = Math.max(profile.requiredColumns.length + profile.optionalColumns.length, 1);
    const score = Math.round((matchedCount / totalColumns) * 100);

    return {
      matchedColumns,
      missingRequiredColumns,
      score,
      warnings,
    };
  }

  private resolveColumn(targetColumn: string, headers: readonly string[], aliases?: Record<string, readonly string[]>): string | undefined {
    const candidates = [targetColumn, ...(aliases?.[targetColumn] ?? [])].map((candidate) => candidate.trim().toLowerCase());
    return headers.find((header) => candidates.includes(header));
  }
}
