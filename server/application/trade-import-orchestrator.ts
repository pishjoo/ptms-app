import { utils } from 'xlsx';
import type { WorkBook } from 'xlsx';
import { ExcelReader } from '@/server/import/excel/excel-reader';
import { FileDetector } from '@/server/import/detection/file-detector';
import { WorksheetLoader } from '@/server/import/excel/worksheet-loader';
import { WorkbookValidator } from '@/server/import/excel/workbook-validator';
import { RegistrationMapper } from '@/server/import/mapping/registration.mapper';
import { AllocationMapper } from '@/server/import/mapping/allocation.mapper';
import { OriginMapper } from '@/server/import/mapping/origin.mapper';
import { DeclarationMapper } from '@/server/import/mapping/declaration.mapper';
import { CommitmentMapper } from '@/server/import/mapping/commitment.mapper';
import type { ImportContext } from '@/server/import/dto/import-context';
import type { ImportPreview } from '@/server/import/dto/import-preview';
import type { ImportWarning } from '@/server/import/dto/import-warning';
import type { ImportError } from '@/server/import/dto/import-error';
import { ChangeDetector, type ExistingRecordLike } from '@/server/import/sync/change-detector';
import type { ChangeSet } from '@/server/import/sync/change-set';

export interface ExistingRecordsProvider {
  (profileType: string): readonly unknown[];
}

export class TradeImportOrchestrator {
  constructor(
    private readonly excelReader: ExcelReader = new ExcelReader(),
    private readonly fileDetector: FileDetector = new FileDetector(),
    private readonly worksheetLoader: WorksheetLoader = new WorksheetLoader(),
    private readonly validator: WorkbookValidator = new WorkbookValidator(),
    private readonly registrationMapper: RegistrationMapper = new RegistrationMapper(),
    private readonly allocationMapper: AllocationMapper = new AllocationMapper(),
    private readonly originMapper: OriginMapper = new OriginMapper(),
    private readonly declarationMapper: DeclarationMapper = new DeclarationMapper(),
    private readonly commitmentMapper: CommitmentMapper = new CommitmentMapper(),
    private readonly changeDetector: ChangeDetector<ExistingRecordLike> = new ChangeDetector<ExistingRecordLike>(),
    private readonly existingRecordsProvider: ExistingRecordsProvider = () => [],
  ) {}

  public previewImport(input: ArrayBuffer | Buffer | Uint8Array | string, context: ImportContext): ImportPreview {
    const workbook = this.excelReader.readWorkbook(input as any) as WorkBook;

    const sheetNames: string[] = (workbook.SheetNames && Array.isArray(workbook.SheetNames) ? workbook.SheetNames : Object.keys(workbook.Sheets ?? {}));

    // Convert sheets to simple rows arrays and attach to sheet['!rows'] so detector can use them
    for (const name of sheetNames) {
      const sheet = workbook.Sheets?.[name];
      try {
        const rows = utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false }) as unknown as (readonly string[])[];
        if (sheet && typeof sheet === 'object') {
          // attach rows in the shape the FileDetector expects
          (sheet as any)['!rows'] = rows;
        }
      } catch (e) {
        // ignore conversion errors per-sheet
      }
    }

    const detection = this.fileDetector.detect({ Sheets: workbook.Sheets ?? {} });

    const loadedWorksheets = this.worksheetLoader.loadWorksheets(sheetNames);

    const worksheetRows: Record<string, readonly string[]> = {};
    for (const logicalName of ['Registration Orders', 'Currency Allocation', 'Origin Registration', 'Customs Declaration', 'Commitment Settlement']) {
      const actual = (loadedWorksheets as any)[this.normalizeKey(logicalName)];
      if (actual && workbook.Sheets?.[actual]) {
        const rows = utils.sheet_to_json<string[]>(workbook.Sheets[actual], { header: 1, raw: false }) as unknown as (readonly string[])[];
        worksheetRows[logicalName] = (rows[0] ?? []) as readonly string[];
      } else {
        worksheetRows[logicalName] = [];
      }
    }

    const validation = this.validator.validateWorkbook(context, loadedWorksheets, worksheetRows);

    const warnings: ImportWarning[] = [...(detection.warnings ?? [] as string[]).map((m) => ({ code: 'detection-warning', message: m })), ...validation.warnings];
    const errors: ImportError[] = [...validation.errors];

    // Only proceed with mapping if validation succeeded
    const changeSets: Record<string, ChangeSet<unknown>> = {};

    let totalRows = 0;
    let importedRows = 0;
    let skippedRows = 0;

    const profile = detection.detectedFileType ?? 'UNKNOWN';

    const tryMap = (logicalName: string, mapper: (worksheet: readonly (readonly string[])[]) => { rows: unknown[]; warnings: string[]; skippedRows: number }) => {
      const actual = (loadedWorksheets as any)[this.normalizeKey(logicalName)] as string | undefined;
      if (!actual) return;
      const sheet = workbook.Sheets?.[actual];
      const rows = sheet ? (utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false }) as unknown as (readonly string[])[]) : [];
      totalRows += Math.max(0, rows.length - 1);
      const result = mapper(rows);
      importedRows += result.rows.length;
      skippedRows += result.skippedRows ?? 0;
      for (const w of result.warnings ?? []) {
        warnings.push({ code: 'mapping-warning', message: `${logicalName}: ${w}`, worksheet: logicalName });
      }

      // run change detection for this type
      const existing = (this.existingRecordsProvider(profile === 'UNKNOWN' ? logicalName : profile) ?? []) as ExistingRecordLike[];
      const cs = this.changeDetector.detectChanges(result.rows as ExistingRecordLike[], existing);
      changeSets[logicalName] = cs as ChangeSet<unknown>;
    };

    // Map only the worksheet corresponding to the detected profile when possible
    switch (profile) {
      case 'REGISTRATION_ORDER':
        tryMap('Registration Orders', (ws) => this.registrationMapper.mapWorksheet(ws));
        break;
      case 'CURRENCY_ALLOCATION':
        tryMap('Currency Allocation', (ws) => this.allocationMapper.mapWorksheet(ws));
        break;
      case 'ORIGIN_REGISTRATION':
        tryMap('Origin Registration', (ws) => this.originMapper.mapWorksheet(ws));
        break;
      case 'CUSTOMS_DECLARATION':
        tryMap('Customs Declaration', (ws) => this.declarationMapper.mapWorksheet(ws));
        break;
      case 'COMMITMENT_SETTLEMENT':
        tryMap('Commitment Settlement', (ws) => this.commitmentMapper.mapWorksheet(ws));
        break;
      default:
        // unknown profile — attempt to map all discovered worksheets
        tryMap('Registration Orders', (ws) => this.registrationMapper.mapWorksheet(ws));
        tryMap('Currency Allocation', (ws) => this.allocationMapper.mapWorksheet(ws));
        tryMap('Origin Registration', (ws) => this.originMapper.mapWorksheet(ws));
        tryMap('Customs Declaration', (ws) => this.declarationMapper.mapWorksheet(ws));
        tryMap('Commitment Settlement', (ws) => this.commitmentMapper.mapWorksheet(ws));
        break;
    }

    const summary = { newCount: 0, updatedCount: 0, removedCount: 0, unchangedCount: 0 };
    for (const key of Object.keys(changeSets)) {
      const cs = changeSets[key];
      summary.newCount += cs.addedRecords.length;
      summary.updatedCount += cs.updatedRecords.length;
      summary.removedCount += cs.removedRecords.length;
      summary.unchangedCount += cs.unchangedRecords.length;
    }

    return {
      detectedFileType: profile,
      totalRows,
      importedRows,
      skippedRows,
      warnings,
      errors,
      changeSummary: summary,
      changeSets,
    };
  }

  private normalizeKey(name: string): string {
    return name
      .replace(/[^a-z0-9]/gi, ' ')
      .trim()
      .split(/\s+/)
      .map((s, idx) => (idx === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))
      .join('');
  }
}

export default TradeImportOrchestrator;
