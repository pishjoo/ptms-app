import type { ImportPreview } from '@/server/application/import-preview/import-preview';
import type {
  ApprovalEngine,
  ImportApproval,
  ApprovalResult,
} from '@/server/domain/approval/index';

/**
 * Application service that orchestrates the approval workflow.
 *
 * This service:
 * 1. Receives an ImportPreview from the preview layer (Sprint 11).
 * 2. Delegates to the domain ApprovalEngine to process the decision.
 * 3. Returns an ApprovalResult with the execution plan.
 *
 * It does NOT write to the database, create UI, or expose API routes.
 * Dependency Injection is used for the ApprovalEngine.
 */
export class ApprovalService {
  /**
   * @param approvalEngine - The domain approval engine used to process decisions.
   *                         Defaults to DefaultApprovalEngine when not provided.
   */
  constructor(private readonly approvalEngine: ApprovalEngine) {}

  /**
   * Process an import preview with an approval decision.
   *
   * @param preview - The ImportPreview produced by ImportPreviewService.
   * @param approval - The approval decision containing the action, actor, and reason.
   * @returns An ApprovalResult containing the execution plan and summary.
   */
  public processApproval(preview: ImportPreview, approval: ImportApproval): ApprovalResult {
    return this.approvalEngine.process(preview, approval);
  }
}

export default ApprovalService;