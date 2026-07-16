import { ColumnResolver } from './column-resolver';
import type { CommitmentImportDto } from '../dto/commitment-import.dto';

export interface CommitmentMappingResult {
  readonly rows: CommitmentImportDto[];
  readonly warnings: string[];
  readonly skippedRows: number;
}

export class CommitmentMapper {
  constructor(private readonly columnResolver: ColumnResolver = new ColumnResolver({
    commitmentNumber: ['commitment no', 'commitment number', 'settlement no'],
    amount: ['amount', 'value'],
    settledAt: ['settled date', 'date'],
  })) {}

  public mapWorksheet(worksheet: readonly (readonly string[])[]): CommitmentMappingResult {
    if (worksheet.length === 0) {
      return { rows: [], warnings: ['Worksheet is empty.'], skippedRows: 0 };
    }

    const headers = worksheet[0].map((cell) => cell?.toString().trim() ?? '');
    const rows = worksheet.slice(1);

    const commitmentNumberColumn = this.columnResolver.resolve(headers, 'commitmentNumber');
    const amountColumn = this.columnResolver.resolve(headers, 'amount');
    const settledAtColumn = this.columnResolver.resolve(headers, 'settledAt');

    const mappedRows: CommitmentImportDto[] = [];
    const warnings: string[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const commitmentNumber = commitmentNumberColumn ? this.normalizeCell(row[commitmentNumberColumn.index]) : undefined;
      const amount = amountColumn ? this.normalizeNumber(row[amountColumn.index]) : undefined;
      const settledAt = settledAtColumn ? this.normalizeDate(row[settledAtColumn.index]) : undefined;

      if (!commitmentNumber && amount === undefined) {
        skippedRows += 1;
        continue;
      }

      mappedRows.push({
        commitmentNumber: commitmentNumber ?? null,
        amount: amount ?? null,
        settledAt,
      });
    }

    return { rows: mappedRows, warnings, skippedRows };
  }

  private normalizeCell(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const normalized = value.toString().trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeNumber(value: unknown): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const normalized = this.normalizeCell(value);
    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private normalizeDate(value: unknown): Date | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const normalized = this.normalizeCell(value);
    if (!normalized) {
      return undefined;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
}
