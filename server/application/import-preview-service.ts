import type { ImportPreview as RawImportPreview } from '@/server/import/dto/import-preview';
import type { ChangeSet } from '@/server/import/sync/change-set';
import type { ChangeType } from '@/server/import/sync/change-type';
import type { PreviewChange } from './import-preview/preview-change';
import type { PreviewItem } from './import-preview/preview-item';
import type { PreviewWarning } from './import-preview/preview-warning';
import type { PreviewError } from './import-preview/preview-error';
import type { PreviewSummary } from './import-preview/preview-summary';
import type {
  ImportPreview,
  TradeCasePreview,
  TradeCasePreviewRegistration,
  TradeCasePreviewAllocation,
  TradeCasePreviewOrigin,
  TradeCasePreviewDeclaration,
  TradeCasePreviewCommitment,
  TradeCaseStateInfo,
} from './import-preview/import-preview';
import { TradeCaseStateEngine } from '@/server/domain/trade-case/state/trade-case-state-engine';

/**
 * Logical sheet names used throughout the import pipeline.
 */
const SHEET_NAMES = {
  REGISTRATION: 'Registration Orders',
  ALLOCATION: 'Currency Allocation',
  ORIGIN: 'Origin Registration',
  DECLARATION: 'Customs Declaration',
  COMMITMENT: 'Commitment Settlement',
} as const;

/**
 * Application service that transforms the raw ImportPreview (from the import layer)
 * into a UI-friendly structure grouped by trade case (registration number).
 *
 * This service does NOT access the database, modify Prisma, or create UI components.
 * It is fully dependency-injected and testable.
 */
export class ImportPreviewService {
  /**
   * @param stateEngine - Engine used to evaluate trade-case state (stage, progress, health, risk, next action, deadlines).
   *                      Defaults to a new TradeCaseStateEngine when not provided.
   */
  constructor(private readonly stateEngine: TradeCaseStateEngine = new TradeCaseStateEngine()) {}
  /**
   * Build a UI-ready ImportPreview from the raw import preview.
   *
   * @param rawPreview - The ImportPreview produced by TradeImportOrchestrator.
   * @returns A fully structured ImportPreview grouped by trade case.
   */
  public buildPreview(rawPreview: RawImportPreview): ImportPreview {
    // Phase 1: Group records by trade case
    const tradeCaseMap = this.groupByTradeCase(rawPreview);

    // Phase 2: Assign warnings/errors to trade cases where possible
    this.assignWarningsAndErrors(rawPreview.warnings, rawPreview.errors, tradeCaseMap);

    // Phase 3: Build final TradeCasePreview objects and collect unassigned items
    const { tradeCases, unassignedWarnings, unassignedErrors } = this.finalizeTradeCases(tradeCaseMap);

    // Phase 4: Compute summary statistics
    const summary = this.computeSummary(rawPreview, tradeCases, unassignedWarnings, unassignedErrors);

    return {
      summary,
      tradeCases,
      unassignedWarnings,
      unassignedErrors,
      detectedFileType: rawPreview.detectedFileType,
      totalRowsProcessed: rawPreview.totalRows,
    };
  }

  // ---------------------------------------------------------------------------
  // Phase 1: Grouping
  // ---------------------------------------------------------------------------

  /**
   * Iterates over every change set, extracts the registration number from each
   * record, and groups records into TradeCasePreviewBuilder objects.
   */
  private groupByTradeCase(rawPreview: RawImportPreview): Map<string, TradeCasePreviewBuilder> {
    const tradeCaseMap = new Map<string, TradeCasePreviewBuilder>();

    for (const [sheetName, changeSet] of Object.entries(rawPreview.changeSets)) {
      this.processChangeSet(sheetName, changeSet, tradeCaseMap);
    }

    return tradeCaseMap;
  }

  /**
   * Process a single ChangeSet and distribute its records into the appropriate
   * trade-case builder.
   */
  private processChangeSet(
    sheetName: string,
    changeSet: ChangeSet<unknown>,
    tradeCaseMap: Map<string, TradeCasePreviewBuilder>,
  ): void {
    const sheetKey = this.resolveSheetKey(sheetName);
    if (!sheetKey) {
      // Registration Orders or unknown sheet — skip item-level processing
      return;
    }

    // Process added records
    for (const entry of changeSet.addedRecords) {
      const regNo = this.extractRegistrationNumber(entry.record);
      if (!regNo) continue;
      const builder = this.getOrCreateBuilder(regNo, entry.record, tradeCaseMap);
      builder.addItem(sheetKey, this.buildPreviewItem(sheetName, entry.record, null, entry.changeType, []));
    }

    // Process updated records
    for (const entry of changeSet.updatedRecords) {
      const regNo = this.extractRegistrationNumber(entry.record);
      if (!regNo) continue;
      const builder = this.getOrCreateBuilder(regNo, entry.record, tradeCaseMap);
      const changes = this.buildChanges(sheetName, entry.record, entry.previousRecord, entry.changedFields);
      builder.addItem(sheetKey, this.buildPreviewItem(sheetName, entry.record, entry.previousRecord, entry.changeType, changes));
    }

    // Process removed records
    for (const entry of changeSet.removedRecords) {
      const regNo = this.extractRegistrationNumber(entry.record);
      if (!regNo) continue;
      const builder = this.getOrCreateBuilder(regNo, entry.record, tradeCaseMap);
      builder.addItem(sheetKey, this.buildPreviewItem(sheetName, entry.record, null, entry.changeType, []));
    }

    // Process unchanged records
    for (const entry of changeSet.unchangedRecords) {
      const regNo = this.extractRegistrationNumber(entry.record);
      if (!regNo) continue;
      const builder = this.getOrCreateBuilder(regNo, entry.record, tradeCaseMap);
      builder.addItem(sheetKey, this.buildPreviewItem(sheetName, entry.record, null, entry.changeType, []));
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2: Warning / Error assignment
  // ---------------------------------------------------------------------------

  /**
   * Attempt to assign each warning and error to a known trade case by matching
   * registration numbers found in the message text.
   */
  private assignWarningsAndErrors(
    warnings: ReadonlyArray<{ readonly code: string; readonly message: string; readonly worksheet?: string; readonly column?: string }>,
    errors: ReadonlyArray<{ readonly code: string; readonly message: string; readonly worksheet?: string; readonly column?: string }>,
    tradeCaseMap: Map<string, TradeCasePreviewBuilder>,
  ): void {
    const knownRegNos = new Set(tradeCaseMap.keys());

    for (const w of warnings) {
      const regNo = this.findRegistrationInMessage(w.message, knownRegNos);
      const previewWarning: PreviewWarning = {
        code: w.code,
        message: w.message,
        worksheet: w.worksheet,
        column: w.column,
        registrationNumber: regNo ?? undefined,
      };
      if (regNo) {
        const builder = tradeCaseMap.get(regNo);
        builder?.addWarning(previewWarning);
      }
    }

    for (const e of errors) {
      const regNo = this.findRegistrationInMessage(e.message, knownRegNos);
      const previewError: PreviewError = {
        code: e.code,
        message: e.message,
        worksheet: e.worksheet,
        column: e.column,
        registrationNumber: regNo ?? undefined,
      };
      if (regNo) {
        const builder = tradeCaseMap.get(regNo);
        builder?.addError(previewError);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 3: Finalization
  // ---------------------------------------------------------------------------

  /**
   * Build immutable TradeCasePreview objects from builders and collect any
   * warnings/errors that were not assigned to a trade case.
   *
   * Each trade case is also evaluated by the TradeCaseStateEngine to compute
   * stage, progress, health, risk, next action, and deadlines.
   */
  private finalizeTradeCases(
    tradeCaseMap: Map<string, TradeCasePreviewBuilder>,
  ): {
    tradeCases: Record<string, TradeCasePreview>;
    unassignedWarnings: readonly PreviewWarning[];
    unassignedErrors: readonly PreviewError[];
  } {
    const tradeCases: Record<string, TradeCasePreview> = {};
    const unassignedWarnings: PreviewWarning[] = [];
    const unassignedErrors: PreviewError[] = [];

    for (const [regNo, builder] of tradeCaseMap) {
      const built = builder.build();
      const state = this.computeTradeCaseState(built);
      tradeCases[regNo] = { ...built, state };
    }

    return { tradeCases, unassignedWarnings, unassignedErrors };
  }

  /**
   * Use the TradeCaseStateEngine to evaluate operational state for a trade case.
   */
  private computeTradeCaseState(preview: Omit<TradeCasePreview, 'state'>): TradeCaseStateInfo {
    const snapshot = {
      hasRegistration: preview.registration.registrationNumber !== null && preview.registration.registrationNumber !== '',
      hasAllocation: preview.allocation.items.length > 0,
      hasOrigin: preview.origin.items.length > 0,
      hasDeclaration: preview.declaration.items.length > 0,
      hasCommitment: preview.commitment.items.length > 0,
    };

    const result = this.stateEngine.evaluate(snapshot);

    return {
      currentStage: result.stage.current,
      nextStage: result.stage.next,
      progressPercent: result.progress.overall,
      stageProgress: result.progress.stages,
      health: result.health.status,
      risk: result.health.riskLevel,
      nextAction: result.nextAction,
      deadlines: result.deadlines,
    };
  }

  // ---------------------------------------------------------------------------
  // PreviewItem construction
  // ---------------------------------------------------------------------------

  /**
   * Build a PreviewItem from a single record.
   */
  private buildPreviewItem(
    sourceSheet: string,
    record: unknown,
    previousRecord: unknown | null,
    changeType: ChangeType,
    changes: readonly PreviewChange[],
  ): PreviewItem {
    const recordObj = this.toRecord(record);
    const prevObj = previousRecord ? this.toRecord(previousRecord) : null;

    return {
      changeType,
      sourceSheet,
      record: recordObj,
      previousRecord: prevObj,
      changes,
      changedFieldNames: changes.map((c) => c.fieldName),
    };
  }

  /**
   * Build field-level changes for an updated record.
   */
  private buildChanges(
    sourceSheet: string,
    record: unknown,
    previousRecord: unknown,
    changedFields: readonly string[],
  ): readonly PreviewChange[] {
    const recordObj = this.toRecord(record);
    const prevObj = this.toRecord(previousRecord);

    return changedFields.map((field) => ({
      sourceSheet,
      fieldName: field,
      oldValue: this.extractValue(prevObj, field),
      newValue: this.extractValue(recordObj, field),
      changeType: 'UPDATED' as ChangeType,
    }));
  }

  // ---------------------------------------------------------------------------
  // Summary computation
  // ---------------------------------------------------------------------------

  /**
   * Compute aggregate summary statistics.
   */
  private computeSummary(
    rawPreview: RawImportPreview,
    tradeCases: Record<string, TradeCasePreview>,
    unassignedWarnings: readonly PreviewWarning[],
    unassignedErrors: readonly PreviewError[],
  ): PreviewSummary {
    let newRecords = 0;
    let updatedRecords = 0;
    let removedRecords = 0;
    let unchangedRecords = 0;
    let totalWarnings = 0;
    let totalErrors = 0;

    for (const tc of Object.values(tradeCases)) {
      newRecords += this.countByChangeType(tc.allocation.items, 'NEW');
      newRecords += this.countByChangeType(tc.origin.items, 'NEW');
      newRecords += this.countByChangeType(tc.declaration.items, 'NEW');
      newRecords += this.countByChangeType(tc.commitment.items, 'NEW');

      updatedRecords += this.countByChangeType(tc.allocation.items, 'UPDATED');
      updatedRecords += this.countByChangeType(tc.origin.items, 'UPDATED');
      updatedRecords += this.countByChangeType(tc.declaration.items, 'UPDATED');
      updatedRecords += this.countByChangeType(tc.commitment.items, 'UPDATED');

      removedRecords += this.countByChangeType(tc.allocation.items, 'REMOVED');
      removedRecords += this.countByChangeType(tc.origin.items, 'REMOVED');
      removedRecords += this.countByChangeType(tc.declaration.items, 'REMOVED');
      removedRecords += this.countByChangeType(tc.commitment.items, 'REMOVED');

      unchangedRecords += this.countByChangeType(tc.allocation.items, 'UNCHANGED');
      unchangedRecords += this.countByChangeType(tc.origin.items, 'UNCHANGED');
      unchangedRecords += this.countByChangeType(tc.declaration.items, 'UNCHANGED');
      unchangedRecords += this.countByChangeType(tc.commitment.items, 'UNCHANGED');

      totalWarnings += tc.warnings.length;
      totalErrors += tc.errors.length;
    }

    totalWarnings += unassignedWarnings.length;
    totalErrors += unassignedErrors.length;

    return {
      totalFiles: Object.keys(rawPreview.changeSets).length,
      totalRegistrations: Object.keys(tradeCases).length,
      newRecords,
      updatedRecords,
      removedRecords,
      unchangedRecords,
      totalWarnings,
      totalErrors,
    };
  }

  /**
   * Count items in a list matching a specific change type.
   */
  private countByChangeType(items: readonly PreviewItem[], changeType: ChangeType): number {
    return items.filter((i) => i.changeType === changeType).length;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Map a logical sheet name to a sheet key used in TradeCasePreview.
   * Returns null for Registration Orders because those records populate the
   * registration block rather than being added as items.
   */
  private resolveSheetKey(sheetName: string): keyof Omit<TradeCasePreview, 'registration' | 'warnings' | 'errors'> | null {
    switch (sheetName) {
      case SHEET_NAMES.REGISTRATION:
        return null; // Registration records populate the registration block, not items
      case SHEET_NAMES.ALLOCATION:
        return 'allocation';
      case SHEET_NAMES.ORIGIN:
        return 'origin';
      case SHEET_NAMES.DECLARATION:
        return 'declaration';
      case SHEET_NAMES.COMMITMENT:
        return 'commitment';
      default:
        return null;
    }
  }

  /**
   * Extract the registration number from a record.
   */
  private extractRegistrationNumber(record: unknown): string | null {
    const obj = this.toRecord(record);
    const value = obj['registrationNumber'];
    if (value === null || value === undefined) return null;
    return String(value);
  }

  /**
   * Get or create a TradeCasePreviewBuilder for the given registration number.
   * When creating, it extracts registration metadata from the first record.
   */
  private getOrCreateBuilder(
    registrationNumber: string,
    record: unknown,
    tradeCaseMap: Map<string, TradeCasePreviewBuilder>,
  ): TradeCasePreviewBuilder {
    let builder = tradeCaseMap.get(registrationNumber);
    if (!builder) {
      const recordObj = this.toRecord(record);
      builder = new TradeCasePreviewBuilder(
        registrationNumber,
        String(recordObj['companyName'] ?? ''),
        String(recordObj['status'] ?? ''),
      );
      tradeCaseMap.set(registrationNumber, builder);
    }
    return builder;
  }

  /**
   * Try to find a known registration number inside a message string.
   */
  private findRegistrationInMessage(
    message: string,
    knownRegNos: Set<string>,
  ): string | null {
    for (const regNo of knownRegNos) {
      if (message.includes(regNo)) {
        return regNo;
      }
    }
    return null;
  }

  /**
   * Safely cast an unknown value to a Record<string, unknown>.
   */
  private toRecord(value: unknown): Record<string, unknown> {
    if (value !== null && value !== undefined && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return {};
  }

  /**
   * Extract a field value from a record, returning null if missing.
   */
  private extractValue(record: Record<string, unknown>, field: string): string | number | boolean | Date | null {
    const value = record[field];
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Internal builder — accumulates items per trade case and produces an
// immutable TradeCasePreview on build().
// ---------------------------------------------------------------------------

class TradeCasePreviewBuilder {
  private readonly allocationItems: PreviewItem[] = [];
  private readonly originItems: PreviewItem[] = [];
  private readonly declarationItems: PreviewItem[] = [];
  private readonly commitmentItems: PreviewItem[] = [];
  private readonly warnings: PreviewWarning[] = [];
  private readonly errors: PreviewError[] = [];

  constructor(
    private readonly registrationNumber: string,
    private readonly companyName: string,
    private readonly status: string,
  ) {}

  /**
   * Add a PreviewItem under the given sheet key.
   */
  public addItem(
    sheetKey: keyof Omit<TradeCasePreview, 'registration' | 'warnings' | 'errors'>,
    item: PreviewItem,
  ): void {
    switch (sheetKey) {
      case 'allocation':
        this.allocationItems.push(item);
        break;
      case 'origin':
        this.originItems.push(item);
        break;
      case 'declaration':
        this.declarationItems.push(item);
        break;
      case 'commitment':
        this.commitmentItems.push(item);
        break;
    }
  }

  /**
   * Add a warning scoped to this trade case.
   */
  public addWarning(warning: PreviewWarning): void {
    this.warnings.push(warning);
  }

  /**
   * Add an error scoped to this trade case.
   */
  public addError(error: PreviewError): void {
    this.errors.push(error);
  }

  /**
   * Build an immutable TradeCasePreview.
   */
  public build(): Omit<TradeCasePreview, 'state'> {
    const registration: TradeCasePreviewRegistration = {
      registrationNumber: this.registrationNumber,
      companyName: this.companyName || null,
      status: this.status || null,
    };

    const allocation: TradeCasePreviewAllocation = { items: Object.freeze([...this.allocationItems]) };
    const origin: TradeCasePreviewOrigin = { items: Object.freeze([...this.originItems]) };
    const declaration: TradeCasePreviewDeclaration = { items: Object.freeze([...this.declarationItems]) };
    const commitment: TradeCasePreviewCommitment = { items: Object.freeze([...this.commitmentItems]) };

    return {
      registration,
      allocation,
      origin,
      declaration,
      commitment,
      warnings: Object.freeze([...this.warnings]),
      errors: Object.freeze([...this.errors]),
    };
  }
}

export default ImportPreviewService;