import type { TradeCaseAggregate } from '../entities/trade-case-aggregate';
import type { TradeCaseStateSnapshot } from './trade-case-state-snapshot';
import type { TradeCaseStage } from './trade-case-stage';
import type { TradeCaseActivityStatus } from './trade-case-activity-status';
import type { BusinessPriority } from './business-priority';
import type { HealthStatus, RiskLevel } from './trade-case-health';
import type { TradeCaseProgress, StageProgress } from './trade-case-progress';
import type { NextAction } from './next-action';
import type { DeadlineCollection } from './deadline-monitor';
import { resolveCurrentStage, resolveNextStage, isCompleted } from './trade-case-stage';
import { computeProgress } from './trade-case-progress';
import { resolveNextAction } from './next-action';
import { evaluateDeadlines } from './deadline-monitor';
import { TradeCaseActivityStatus as ActivityStatusEnum } from './trade-case-activity-status';
import { BusinessPriority as BusinessPriorityEnum } from './business-priority';

/**
 * Builds an immutable TradeCaseStateSnapshot from a TradeCaseAggregate.
 *
 * This builder centralizes all derived calculations so that business rules
 * consume a unified snapshot instead of recalculating values from the aggregate.
 */
export class TradeCaseStateSnapshotBuilder {
  /**
   * Build a TradeCaseStateSnapshot from a trade case aggregate.
   *
   * @param tradeCase - The trade case aggregate containing raw data.
   * @param dates - Optional dates for deadline evaluation.
   * @returns An immutable TradeCaseStateSnapshot.
   */
  public build(
    tradeCase: TradeCaseAggregate,
    dates?: {
      registrationDate?: Date | null;
      allocationDate?: Date | null;
      originDate?: Date | null;
      declarationDate?: Date | null;
      commitmentDate?: Date | null;
    },
  ): TradeCaseStateSnapshot {
    const stageSnapshot = this.createStageSnapshot(tradeCase);
    const currentStage = resolveCurrentStage(stageSnapshot);
    const nextStage = resolveNextStage(stageSnapshot);
    const completed = isCompleted(stageSnapshot);
    const progress = computeProgress({ ...stageSnapshot, currentStage, nextStage });
    const health = this.evaluateHealth(stageSnapshot, progress);
    const nextAction = resolveNextAction(stageSnapshot);
    const deadlines = evaluateDeadlines(dates ?? {});
    const activityStatus = this.resolveActivityStatus(tradeCase.status);
    const businessPriority = this.calculateBusinessPriority(tradeCase);

    return Object.freeze({
      registrationStatus: tradeCase.status,
      currentStage,
      activityStatus,
      businessPriority,
      health: health.status,
      risk: health.riskLevel,
      progress,
      remainingAllocation: tradeCase.remainingAllocation,
      remainingOrigin: tradeCase.remainingOrigin,
      remainingDeclaration: tradeCase.remainingDeclaration,
      remainingCommitment: tradeCase.remainingCommitment,
      deadlines,
      nextAction,
    });
  }

  /**
   * Create a stage snapshot from the trade case aggregate.
   */
  private createStageSnapshot(tradeCase: TradeCaseAggregate): {
    hasRegistration: boolean;
    hasAllocation: boolean;
    hasOrigin: boolean;
    hasDeclaration: boolean;
    hasCommitment: boolean;
  } {
    return {
      hasRegistration: this.hasDataObject(tradeCase.registration),
      hasAllocation: this.hasData(tradeCase.allocations),
      hasOrigin: this.hasData(tradeCase.origins),
      hasDeclaration: this.hasData(tradeCase.declarations),
      hasCommitment: this.hasData(tradeCase.commitments),
    };
  }

  /**
   * Check if a collection has data.
   */
  private hasData(items: readonly unknown[] | undefined | null): boolean {
    return Array.isArray(items) && items.length > 0;
  }

  /**
   * Check if a single object has data (not null/undefined).
   */
  private hasDataObject(item: unknown | undefined | null): boolean {
    return item !== null && item !== undefined;
  }

  /**
   * Resolve the activity status from the registration status string.
   */
  private resolveActivityStatus(status: string): TradeCaseActivityStatus {
    const upper = status.toUpperCase();

    if (upper.includes('COMPLETED') || upper.includes('CLOSED')) {
      return ActivityStatusEnum.COMPLETED;
    }

    if (upper.includes('BLOCKED')) {
      return ActivityStatusEnum.BLOCKED;
    }

    if (upper.includes('WAITING') && upper.includes('BANK')) {
      return ActivityStatusEnum.WAITING_BANK;
    }

    if (upper.includes('WAITING') && upper.includes('CUSTOMS')) {
      return ActivityStatusEnum.WAITING_CUSTOMS;
    }

    return ActivityStatusEnum.ACTIVE;
  }

  /**
   * Calculate business priority based on remaining obligations and urgency factors.
   */
  private calculateBusinessPriority(tradeCase: TradeCaseAggregate): BusinessPriority {
    let score = 0;

    // Factor 1: Large remaining origin increases priority
    if (tradeCase.remainingOrigin > 100000) {
      score += 2;
    } else if (tradeCase.remainingOrigin > 0) {
      score += 1;
    }

    // Factor 2: Large remaining declaration increases priority
    if (tradeCase.remainingDeclaration > 100000) {
      score += 2;
    } else if (tradeCase.remainingDeclaration > 0) {
      score += 1;
    }

    // Factor 3: Large remaining commitment increases priority
    if (tradeCase.remainingCommitment > 100000) {
      score += 2;
    } else if (tradeCase.remainingCommitment > 0) {
      score += 1;
    }

    // Map score to priority level
    if (score >= 5) {
      return BusinessPriorityEnum.CRITICAL;
    } else if (score >= 3) {
      return BusinessPriorityEnum.HIGH;
    } else if (score >= 1) {
      return BusinessPriorityEnum.MEDIUM;
    }

    return BusinessPriorityEnum.LOW;
  }

  /**
   * Evaluate health and risk from a stage snapshot and progress.
   */
  private evaluateHealth(
    snapshot: { hasRegistration: boolean; hasAllocation: boolean; hasOrigin: boolean; hasDeclaration: boolean; hasCommitment: boolean },
    progress: TradeCaseProgress,
  ): { status: HealthStatus; riskLevel: RiskLevel } {
    const current = resolveCurrentStage(snapshot);
    const next = resolveNextStage(snapshot);
    const completed = isCompleted(snapshot);

    const riskLevel = this.evaluateRiskLevel(snapshot, progress.overall);
    const status = completed ? 'HEALTHY' : this.mapRiskToHealth(riskLevel);

    return { status, riskLevel };
  }

  /**
   * Determine risk level based on stage completeness and overall progress.
   */
  private evaluateRiskLevel(
    snapshot: { hasRegistration: boolean; hasAllocation: boolean; hasOrigin: boolean; hasDeclaration: boolean; hasCommitment: boolean },
    overallPercent: number,
  ): RiskLevel {
    const completedCount = [
      snapshot.hasRegistration,
      snapshot.hasAllocation,
      snapshot.hasOrigin,
      snapshot.hasDeclaration,
      snapshot.hasCommitment,
    ].filter(Boolean).length;

    if (completedCount === 0) return 'CRITICAL';
    if (overallPercent < 40) return 'HIGH';
    if (overallPercent < 80) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Map a risk level to a health status.
   */
  private mapRiskToHealth(riskLevel: RiskLevel): HealthStatus {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'NEEDS_ATTENTION';
      case 'MEDIUM':
        return 'NEEDS_ATTENTION';
      case 'LOW':
        return 'HEALTHY';
    }
  }
}

export default TradeCaseStateSnapshotBuilder;