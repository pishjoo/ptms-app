export interface ColumnResolutionResult {
  readonly index: number;
  readonly name: string;
}

export class ColumnResolver {
  constructor(private readonly aliasesByColumn: Record<string, readonly string[]> = {}) {}

  public resolve(headers: readonly string[], targetColumn: string): ColumnResolutionResult | undefined {
    const normalizedHeaders = headers.map((header) => header.trim());
    const aliasList = this.aliasesByColumn[targetColumn] ?? [];
    const candidates = [targetColumn, ...aliasList].map((candidate) => candidate.trim().toLowerCase());

    for (let index = 0; index < normalizedHeaders.length; index += 1) {
      const header = normalizedHeaders[index].trim().toLowerCase();
      if (candidates.includes(header)) {
        return { index, name: normalizedHeaders[index] };
      }
    }

    return undefined;
  }
}
