import type { ImportContext } from '../dto/import-context';
import type { ImportError } from '../dto/import-error';
import type { ImportResult } from '../dto/import-result';
import type { ImportWarning } from '../dto/import-warning';
import type { LoadedWorksheets } from './worksheet-loader';

export interface WorkbookValidationConfig {
  readonly requiredWorksheets: readonly string[];
  readonly requiredColumnsByWorksheet: Record<string, readonly string[]>;
}

export class WorkbookValidator {
  constructor(
    private readonly config: WorkbookValidationConfig = {
      requiredWorksheets: [
        'Registration Orders',
        'Currency Allocation',
        'Origin Registration',
        'Customs Declaration',
        'Commitment Settlement',
      ],
      requiredColumnsByWorksheet: {
        'Registration Orders': ['Registration Number', 'Company Name'],
        'Currency Allocation': ['Currency', 'Amount'],
        'Origin Registration': ['Origin', 'Amount'],
        'Customs Declaration': ['Declaration Number', 'Amount'],
        'Commitment Settlement': ['Commitment Number', 'Amount'],
      },
    },
  ) {}

  public validateWorkbook(
    context: ImportContext,
    loadedWorksheets: LoadedWorksheets,
    worksheetRows: Record<string, readonly string[]>,
  ): ImportResult {
    const warnings: ImportWarning[] = [];
    const errors: ImportError[] = [];
    const discoveredWorksheets = {
      'Registration Orders': Boolean(loadedWorksheets.registrationOrders),
      'Currency Allocation': Boolean(loadedWorksheets.currencyAllocation),
      'Origin Registration': Boolean(loadedWorksheets.originRegistration),
      'Customs Declaration': Boolean(loadedWorksheets.customsDeclaration),
      'Commitment Settlement': Boolean(loadedWorksheets.commitmentSettlement),
    };

    for (const worksheetName of this.config.requiredWorksheets) {
      const isPresent = discoveredWorksheets[worksheetName as keyof typeof discoveredWorksheets];

      if (!isPresent) {
        errors.push({
          code: 'missing-worksheet',
          message: `Required worksheet not found: ${worksheetName}`,
          worksheet: worksheetName,
        });
        continue;
      }

      const columns = worksheetRows[worksheetName] ?? [];
      const requiredColumns = this.config.requiredColumnsByWorksheet[worksheetName] ?? [];

      const missingColumns = requiredColumns.filter((column) => !columns.includes(column));

      if (columns.length === 0) {
        warnings.push({
          code: 'empty-worksheet',
          message: `Worksheet is empty: ${worksheetName}`,
          worksheet: worksheetName,
        });
      }

      if (missingColumns.length > 0) {
        warnings.push({
          code: 'missing-columns',
          message: `Missing columns in ${worksheetName}: ${missingColumns.join(', ')}`,
          worksheet: worksheetName,
          column: missingColumns[0],
        });
      }
    }

    return {
      context,
      success: errors.length === 0,
      warnings,
      errors,
      discoveredWorksheets,
      validatedWorksheets: this.config.requiredWorksheets.filter((worksheetName) => discoveredWorksheets[worksheetName as keyof typeof discoveredWorksheets]),
    };
  }
}
