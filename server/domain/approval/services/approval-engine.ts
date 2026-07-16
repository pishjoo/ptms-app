import type { ApprovalDecision } from '../entities/approval-decision';
import type { ImportApproval } from '../entities/import-approval';
import type { ApprovalResult } from '../entities/approval-result';
import type { ApprovalSummary } from '../entities/approval-summary';
import type { ExecutionPlan, EntityExecutionItem, ManualFieldPreservation } from '../entities/execution-plan';
import type { ImportPreview } from '@/server/application/import-preview/import-preview';
import type { PreviewItem } from '@/server/application/import-preview/preview-item';

/**
 * Interface for the approval engine that processes import previews
 * and produces execution plans.
 */
export interface ApprovalEngine {
  /**
   * Process an import preview with the given approval decision.
   *
   * @param preview - The ImportPreview produced by ImportPreviewService.
   * @param approval - The approval decision (who, what, when, why).
   * @returns An ApprovalResult containing the execution plan and summary.
   */
  process(preview: ImportPreview, approval: ImportApproval): ApprovalResult;
}

/**
 * Default implementation of the ApprovalEngine.
 *
 * This engine:
 * 1. Receives the ImportPreview from Sprint 11.
 * 2. Applies the approval decision (APPROVE_IMPORT, CANCEL_IMPORT, PARTIAL_APPROVAL).
 * 3. Produces an ExecutionPlan classifying entities into:
 *    - entities to create
 *    - entities to update
 *    - entities to ignore
 *    - manual fields to preserve
 * 4. Returns an ApprovalResult with the plan and summary.
 *
 * IMPORTANT: This engine does NOT write to the database. It only prepares
 * the execution plan for a future persistence layer.
 */
export class DefaultApprovalEngine implements ApprovalEngine {
  /**
   * Fields that are considered "manual" and should be preserved
   * from overwrite during import. These are fields that users
   * typically enter directly in the system rather than via NTSW.
   */
  private readonly manualFieldPatterns: readonly string[] = [
    'notes',
    'comments',
    'internalReference',
    'manualOverride',
    'userNote',
  ];

  /**
   * @param manualFieldPatterns - Optional custom list of field name patterns
   *                              that should be treated as manual fields.
   */
  constructor(manualFieldPatterns?: readonly string[]) {
    if (manualFieldPatterns) {
      this.manualFieldPatterns = manualFieldPatterns;
    }
  }

  /**
   * Process the import preview with the given approval decision.
   */
  public process(preview: ImportPreview, approval: ImportApproval): ApprovalResult {
    try {
      switch (approval.decision) {
        case 'APPROVE_IMPORT':
          return this.handleApproveImport(preview, approval);
        case 'CANCEL_IMPORT':
          return this.handleCancelImport(preview, approval);
        case 'PARTIAL_APPROVAL':
          return this.handlePartialApproval(preview, approval);
        default:
          return this.createErrorResult(approval, `Unknown approval decision: ${approval.decision}`);
      }
    } catch (error) {
      return this.createErrorResult(
        approval,
        error instanceof Error ? error.message : 'Unexpected error during approval processing',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Decision handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle APPROVE_IMPORT: Accept all changes and build a full execution plan.
   */
  private handleApproveImport(preview: ImportPreview, approval: ImportApproval): ApprovalResult {
    const entitiesToCreate = this.collectEntitiesToCreate(preview);
    const entitiesToUpdate = this.collectEntitiesToUpdate(preview);
    const entitiesToIgnore = this.collectEntitiesToIgnore(preview);
    const manualFieldsToPreserve = this.collectManualFields(preview);

    const executionPlan: ExecutionPlan = {
      entitiesToCreate,
      entitiesToUpdate,
      entitiesToIgnore,
      manualFieldsToPreserve,
      approved: true,
      createdAt: new Date().toISOString(),
    };

    const summary = this.buildSummary(preview, approval.decision, executionPlan);

    return {
      approval,
      executionPlan,
      summary,
      success: true,
      error: null,
    };
  }

  /**
   * Handle CANCEL_IMPORT: Reject all changes. The execution plan will have
   * empty create/update lists and all entities classified as "ignore".
   */
  private handleCancelImport(preview: ImportPreview, approval: ImportApproval): ApprovalResult {
    const allEntities = this.collectAllEntities(preview);

    const executionPlan: ExecutionPlan = {
      entitiesToCreate: [],
      entitiesToUpdate: [],
      entitiesToIgnore: allEntities,
      manualFieldsToPreserve: [],
      approved: false,
      createdAt: new Date().toISOString(),
    };

    const summary = this.buildSummary(preview, approval.decision, executionPlan);

    return {
      approval,
      executionPlan,
      summary,
      success: true,
      error: null,
    };
  }

  /**
   * Handle PARTIAL_APPROVAL: Future-ready. For now, treat all entities as
   * "ignore" with a note that partial approval is not yet implemented.
   */
  private handlePartialApproval(preview: ImportPreview, approval: ImportApproval): ApprovalResult {
    const allEntities = this.collectAllEntities(preview);

    const executionPlan: ExecutionPlan = {
      entitiesToCreate: [],
      entitiesToUpdate: [],
      entitiesToIgnore: allEntities,
      manualFieldsToPreserve: [],
      approved: false,
      createdAt: new Date().toISOString(),
    };

    const summary = this.buildSummary(preview, approval.decision, executionPlan);

    return {
      approval,
      executionPlan,
      summary,
      success: true,
      error: 'PARTIAL_APPROVAL is not yet implemented. All entities have been classified as "ignore".',
    };
  }

  // ---------------------------------------------------------------------------
  // Entity collection helpers
  // ---------------------------------------------------------------------------

  /**
   * Collect all entities that should be created (NEW records).
   */
  private collectEntitiesToCreate(preview: ImportPreview): readonly EntityExecutionItem[] {
    const items: EntityExecutionItem[] = [];

    for (const [regNo, tc] of Object.entries(preview.tradeCases)) {
      this.collectItemsByType(items, regNo, 'allocation', tc.allocation.items, 'NEW');
      this.collectItemsByType(items, regNo, 'origin', tc.origin.items, 'NEW');
      this.collectItemsByType(items, regNo, 'declaration', tc.declaration.items, 'NEW');
      this.collectItemsByType(items, regNo, 'commitment', tc.commitment.items, 'NEW');
    }

    return Object.freeze(items);
  }

  /**
   * Collect all entities that should be updated (UPDATED records).
   */
  private collectEntitiesToUpdate(preview: ImportPreview): readonly EntityExecutionItem[] {
    const items: EntityExecutionItem[] = [];

    for (const [regNo, tc] of Object.entries(preview.tradeCases)) {
      this.collectItemsByType(items, regNo, 'allocation', tc.allocation.items, 'UPDATED');
      this.collectItemsByType(items, regNo, 'origin', tc.origin.items, 'UPDATED');
      this.collectItemsByType(items, regNo, 'declaration', tc.declaration.items, 'UPDATED');
      this.collectItemsByType(items, regNo, 'commitment', tc.commitment.items, 'UPDATED');
    }

    return Object.freeze(items);
  }

  /**
   * Collect all entities that should be ignored (UNCHANGED and REMOVED records).
   */
  private collectEntitiesToIgnore(preview: ImportPreview): readonly EntityExecutionItem[] {
    const items: EntityExecutionItem[] = [];

    for (const [regNo, tc] of Object.entries(preview.tradeCases)) {
      this.collectItemsByType(items, regNo, 'allocation', tc.allocation.items, 'UNCHANGED');
      this.collectItemsByType(items, regNo, 'origin', tc.origin.items, 'UNCHANGED');
      this.collectItemsByType(items, regNo, 'declaration', tc.declaration.items, 'UNCHANGED');
      this.collectItemsByType(items, regNo, 'commitment', tc.commitment.items, 'UNCHANGED');
      this.collectItemsByType(items, regNo, 'allocation', tc.allocation.items, 'REMOVED');
      this.collectItemsByType(items, regNo, 'origin', tc.origin.items, 'REMOVED');
      this.collectItemsByType(items, regNo, 'declaration', tc.declaration.items, 'REMOVED');
      this.collectItemsByType(items, regNo, 'commitment', tc.commitment.items, 'REMOVED');
    }

    return Object.freeze(items);
  }

  /**
   * Collect all entities across all trade cases (used for CANCEL_IMPORT).
   */
  private collectAllEntities(preview: ImportPreview): readonly EntityExecutionItem[] {
    const items: EntityExecutionItem[] = [];

    for (const [regNo, tc] of Object.entries(preview.tradeCases)) {
      this.collectItemsByType(items, regNo, 'allocation', tc.allocation.items, null);
      this.collectItemsByType(items, regNo, 'origin', tc.origin.items, null);
      this.collectItemsByType(items, regNo, 'declaration', tc.declaration.items, null);
      this.collectItemsByType(items, regNo, 'commitment', tc.commitment.items, null);
    }

    return Object.freeze(items);
  }

  /**
   * Collect items of a specific type and change type into the result array.
   */
  private collectItemsByType(
    items: EntityExecutionItem[],
    registrationNumber: string,
    entityType: string,
    previewItems: readonly PreviewItem[],
    changeTypeFilter: string | null,
  ): void {
    for (const pi of previewItems) {
      if (changeTypeFilter !== null && pi.changeType !== changeTypeFilter) {
        continue;
      }

      const action = this.resolveAction(pi.changeType);

      items.push({
        entityType,
        registrationNumber,
        action,
        data: Object.freeze({ ...pi.record }),
        previousData: pi.previousRecord ? Object.freeze({ ...pi.previousRecord }) : null,
        changedFields: Object.freeze([...pi.changedFieldNames]),
      });
    }
  }

  /**
   * Resolve the entity action based on the change type.
   */
  private resolveAction(changeType: string): 'CREATE' | 'UPDATE' | 'IGNORE' {
    switch (changeType) {
      case 'NEW':
        return 'CREATE';
      case 'UPDATED':
        return 'UPDATE';
      default:
        return 'IGNORE';
    }
  }

  // ---------------------------------------------------------------------------
  // Manual field detection
  // ---------------------------------------------------------------------------

  /**
   * Detect manual fields in updated records that should be preserved.
   * A field is considered "manual" if its name matches one of the known
   * manual field patterns AND the field exists in the previous record
   * (meaning it has an existing value in the database).
   */
  private collectManualFields(preview: ImportPreview): readonly ManualFieldPreservation[] {
    const manualFields: ManualFieldPreservation[] = [];

    for (const [regNo, tc] of Object.entries(preview.tradeCases)) {
      this.collectManualFieldsFromItems(manualFields, regNo, 'allocation', tc.allocation.items);
      this.collectManualFieldsFromItems(manualFields, regNo, 'origin', tc.origin.items);
      this.collectManualFieldsFromItems(manualFields, regNo, 'declaration', tc.declaration.items);
      this.collectManualFieldsFromItems(manualFields, regNo, 'commitment', tc.commitment.items);
    }

    return Object.freeze(manualFields);
  }

  /**
   * Scan preview items for manual fields that need preservation.
   */
  private collectManualFieldsFromItems(
    manualFields: ManualFieldPreservation[],
    registrationNumber: string,
    entityType: string,
    previewItems: readonly PreviewItem[],
  ): void {
    for (const pi of previewItems) {
      if (pi.changeType !== 'UPDATED' || !pi.previousRecord) {
        continue;
      }

      for (const fieldName of pi.changedFieldNames) {
        if (this.isManualField(fieldName)) {
          manualFields.push({
            registrationNumber,
            entityType,
            fieldName,
            currentValue: pi.previousRecord[fieldName] ?? null,
          });
        }
      }
    }
  }

  /**
   * Check if a field name matches a manual field pattern.
   */
  private isManualField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return this.manualFieldPatterns.some(
      (pattern) => lower === pattern.toLowerCase() || lower.includes(pattern.toLowerCase()),
    );
  }

  // ---------------------------------------------------------------------------
  // Summary builder
  // ---------------------------------------------------------------------------

  /**
   * Build an ApprovalSummary from the preview and execution plan.
   */
  private buildSummary(
    preview: ImportPreview,
    decision: ApprovalDecision,
    plan: ExecutionPlan,
  ): ApprovalSummary {
    const totalEntities =
      plan.entitiesToCreate.length +
      plan.entitiesToUpdate.length +
      plan.entitiesToIgnore.length;

    return {
      totalTradeCases: Object.keys(preview.tradeCases).length,
      totalEntities,
      entitiesToCreate: plan.entitiesToCreate.length,
      entitiesToUpdate: plan.entitiesToUpdate.length,
      entitiesToIgnore: plan.entitiesToIgnore.length,
      entitiesWithManualFields: plan.manualFieldsToPreserve.length,
      decision,
      createdAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Error result builder
  // ---------------------------------------------------------------------------

  /**
   * Create an error ApprovalResult.
   */
  private createErrorResult(approval: ImportApproval, errorMessage: string): ApprovalResult {
    const emptyPlan: ExecutionPlan = {
      entitiesToCreate: [],
      entitiesToUpdate: [],
      entitiesToIgnore: [],
      manualFieldsToPreserve: [],
      approved: false,
      createdAt: new Date().toISOString(),
    };

    return {
      approval,
      executionPlan: emptyPlan,
      summary: {
        totalTradeCases: 0,
        totalEntities: 0,
        entitiesToCreate: 0,
        entitiesToUpdate: 0,
        entitiesToIgnore: 0,
        entitiesWithManualFields: 0,
        decision: approval.decision,
        createdAt: new Date().toISOString(),
      },
      success: false,
      error: errorMessage,
    };
  }
}

export default DefaultApprovalEngine;