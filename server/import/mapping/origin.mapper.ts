import { ColumnResolver } from './column-resolver';
import type { OriginImportDto } from '../dto/origin-import.dto';

export interface OriginMappingResult {
  readonly rows: OriginImportDto[];
  readonly warnings: string[];
  readonly skippedRows: number;
}

export class OriginMapper {
  constructor(private readonly columnResolver: ColumnResolver = new ColumnResolver({
    origin: ['origin', 'country of origin', 'country'],
    amount: ['amount', 'value'],
    registeredAt: ['registered date', 'date'],
  })) {}

  public mapWorksheet(worksheet: readonly (readonly string[])[]): OriginMappingResult {
    if (worksheet.length === 0) {
      return { rows: [], warnings: ['Worksheet is empty.'], skippedRows: 0 };
    }

    const headers = worksheet[0].map((cell) => cell?.toString().trim() ?? '');
    const rows = worksheet.slice(1);

    const originColumn = this.columnResolver.resolve(headers, 'origin');
    const amountColumn = this.columnResolver.resolve(headers, 'amount');
    const registeredAtColumn = this.columnResolver.resolve(headers, 'registeredAt');

    const mappedRows: OriginImportDto[] = [];
    const warnings: string[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const origin = originColumn ? this.normalizeCell(row[originColumn.index]) : undefined;
      const amount = amountColumn ? this.normalizeNumber(row[amountColumn.index]) : undefined;
      const registeredAt = registeredAtColumn ? this.normalizeDate(row[registeredAtColumn.index]) : undefined;

      if (!origin && amount === undefined) {
        skippedRows += 1;
        continue;
      }

      mappedRows.push({
        origin: origin ?? null,
        amount: amount ?? null,
        registeredAt,
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
