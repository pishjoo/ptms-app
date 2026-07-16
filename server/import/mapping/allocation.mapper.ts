import { ColumnResolver } from './column-resolver';
import type { AllocationImportDto } from '../dto/allocation-import.dto';

export interface AllocationMappingResult {
  readonly rows: AllocationImportDto[];
  readonly warnings: string[];
  readonly skippedRows: number;
}

export class AllocationMapper {
  constructor(private readonly columnResolver: ColumnResolver = new ColumnResolver({
    allocationNumber: ['allocation no', 'request no', 'request number'],
    currency: ['currency', 'currency code'],
    amount: ['amount', 'value'],
    approvedAt: ['approved date', 'date'],
  })) {}

  public mapWorksheet(worksheet: readonly (readonly string[])[]): AllocationMappingResult {
    if (worksheet.length === 0) {
      return { rows: [], warnings: ['Worksheet is empty.'], skippedRows: 0 };
    }

    const headers = worksheet[0].map((cell) => cell?.toString().trim() ?? '');
    const rows = worksheet.slice(1);

    const allocationNumberColumn = this.columnResolver.resolve(headers, 'allocationNumber');
    const currencyColumn = this.columnResolver.resolve(headers, 'currency');
    const amountColumn = this.columnResolver.resolve(headers, 'amount');
    const approvedAtColumn = this.columnResolver.resolve(headers, 'approvedAt');

    const mappedRows: AllocationImportDto[] = [];
    const warnings: string[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const allocationNumber = allocationNumberColumn ? this.normalizeCell(row[allocationNumberColumn.index]) : undefined;
      const currency = currencyColumn ? this.normalizeCell(row[currencyColumn.index]) : undefined;
      const amount = amountColumn ? this.normalizeNumber(row[amountColumn.index]) : undefined;
      const approvedAt = approvedAtColumn ? this.normalizeDate(row[approvedAtColumn.index]) : undefined;

      if (!allocationNumber && !currency && amount === undefined) {
        skippedRows += 1;
        continue;
      }

      mappedRows.push({
        allocationNumber: allocationNumber ?? null,
        currency: currency ?? null,
        amount: amount ?? null,
        approvedAt,
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
