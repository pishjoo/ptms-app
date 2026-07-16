import { ColumnResolver } from './column-resolver';
import type { RegistrationImportDto } from '../dto/registration-import.dto';

export interface RegistrationMappingResult {
  readonly rows: RegistrationImportDto[];
  readonly warnings: string[];
  readonly skippedRows: number;
}

export class RegistrationMapper {
  constructor(private readonly columnResolver: ColumnResolver = new ColumnResolver({
    registrationNumber: ['reg no', 'registration no', 'reg number'],
    companyName: ['company', 'customer', 'trader'],
    status: ['workflow status', 'status'],
    submittedAt: ['submitted date', 'registration date', 'date'],
  })) {}

  public mapWorksheet(worksheet: readonly (readonly string[])[]): RegistrationMappingResult {
    if (worksheet.length === 0) {
      return { rows: [], warnings: ['Worksheet is empty.'], skippedRows: 0 };
    }

    const headers = worksheet[0].map((cell) => cell?.toString().trim() ?? '');
    const rows = worksheet.slice(1);

    const registrationNumberColumn = this.columnResolver.resolve(headers, 'registrationNumber');
    const companyNameColumn = this.columnResolver.resolve(headers, 'companyName');
    const statusColumn = this.columnResolver.resolve(headers, 'status');
    const submittedAtColumn = this.columnResolver.resolve(headers, 'submittedAt');

    const mappedRows: RegistrationImportDto[] = [];
    const warnings: string[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const registrationNumber = registrationNumberColumn ? this.normalizeCell(row[registrationNumberColumn.index]) : undefined;
      const companyName = companyNameColumn ? this.normalizeCell(row[companyNameColumn.index]) : undefined;
      const status = statusColumn ? this.normalizeCell(row[statusColumn.index]) : undefined;
      const submittedAt = submittedAtColumn ? this.normalizeDate(row[submittedAtColumn.index]) : undefined;

      if (!registrationNumber && !companyName && !status) {
        skippedRows += 1;
        continue;
      }

      mappedRows.push({
        registrationNumber: registrationNumber ?? null,
        companyName: companyName ?? null,
        status: status ?? null,
        submittedAt,
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
