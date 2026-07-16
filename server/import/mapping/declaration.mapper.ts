import { ColumnResolver } from './column-resolver';
import type { DeclarationImportDto } from '../dto/declaration-import.dto';

export interface DeclarationMappingResult {
  readonly rows: DeclarationImportDto[];
  readonly warnings: string[];
  readonly skippedRows: number;
}

export class DeclarationMapper {
  constructor(private readonly columnResolver: ColumnResolver = new ColumnResolver({
    declarationNumber: ['declaration no', 'declaration number', 'customs no'],
    amount: ['amount', 'value'],
    declaredAt: ['declared date', 'date'],
  })) {}

  public mapWorksheet(worksheet: readonly (readonly string[])[]): DeclarationMappingResult {
    if (worksheet.length === 0) {
      return { rows: [], warnings: ['Worksheet is empty.'], skippedRows: 0 };
    }

    const headers = worksheet[0].map((cell) => cell?.toString().trim() ?? '');
    const rows = worksheet.slice(1);

    const declarationNumberColumn = this.columnResolver.resolve(headers, 'declarationNumber');
    const amountColumn = this.columnResolver.resolve(headers, 'amount');
    const declaredAtColumn = this.columnResolver.resolve(headers, 'declaredAt');

    const mappedRows: DeclarationImportDto[] = [];
    const warnings: string[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const declarationNumber = declarationNumberColumn ? this.normalizeCell(row[declarationNumberColumn.index]) : undefined;
      const amount = amountColumn ? this.normalizeNumber(row[amountColumn.index]) : undefined;
      const declaredAt = declaredAtColumn ? this.normalizeDate(row[declaredAtColumn.index]) : undefined;

      if (!declarationNumber && amount === undefined) {
        skippedRows += 1;
        continue;
      }

      mappedRows.push({
        declarationNumber: declarationNumber ?? null,
        amount: amount ?? null,
        declaredAt,
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
