import type { TradeCaseStage, TradeCaseStageSnapshot } from './trade-case-stage';
import {
  resolveCurrentStage,
  resolveNextStage,
  isCompleted,
} from './trade-case-stage';
import type { TradeCaseHealth, HealthStatus, RiskLevel } from './trade-case-health';
import type { TradeCaseProgress, StageProgress } from './trade-case-progress';
import { computeProgress } from './trade-case-progress';
import type { NextAction } from './next-action';
import { resolveNextAction } from './next-action';
import type { DeadlineCollection } from './deadline-monitor';
import { evaluateDeadlines } from './deadline-monitor';

/**
 * Aggregate result produced by the TradeCaseStateEngine for a single trade case.
 */
export interface TradeCaseStateEngineResult {
  /** Evaluated stage information. */
  readonly stage: {
    readonly current: TradeCaseStage;
    readonly next: TradeCaseStage;
    readonly completed: boolean;
  };

  /** Health and risk evaluation. */
  readonly health: TradeCaseHealth;

  /** Progress percentage per stage and overall. */
  readonly progress: TradeCaseProgress;

  /** The next required action. */
  readonly nextAction: NextAction;

  /** Deadline monitoring results. */
  readonly deadlines: DeadlineCollection;
}

/**
 * Trade Case State Engine — the single entry point for computing the operational
 * state of a trade case based on its imported data.
 *
 * This engine:
 *  - Determines the current and next stage
 *  - Evaluates health (HEALTHY / NEEDS_ATTENTION / CRITICAL)
 *  - Calculates risk (LOW / MEDIUM / HIGH / CRITICAL)
 *  - Computes per-stage and overall progress percentages
 *  - Resolves the next required action
 *  - Monitors deadlines and returns daysRemaining / isExpired / isWarning / severity
 *
 * It does NOT access the database or modify Prisma. It is fully
 * dependency-injected (via constructor) and testable.
 */
export class TradeCaseStateEngine {
  /**
   * Run the full state evaluation for a single trade case.
   *
   * @param snapshot - Data snapshot describing what data exists for each stage.
   * @param dates - Optional dates for deadline evaluation.
   * @returns A TradeCaseStateEngineResult with all computed values.
   */
  public evaluate(
    snapshot: TradeCaseStageSnapshot,
    dates?: {
      registrationDate?: Date | null;
      allocationDate?: Date | null;
      originDate?: Date | null;
      declarationDate?: Date | null;
      commitmentDate?: Date | null;
    },
  ): TradeCaseStateEngineResult {
    // 1. Stage resolution
    const current = resolveCurrentStage(snapshot);
    const next = resolveNextStage(snapshot);
    const completed = isCompleted(snapshot);

    // 2. Progress calculation
    const progress = computeProgress({ ...snapshot, currentStage: current, nextStage: next });

    // 3. Health and risk evaluation
    const health = this.evaluateHealth(snapshot, progress);

    // 4. Next action
    const nextAction = resolveNextAction(snapshot);

    // 5. Deadlines
    const deadlines = evaluateDeadlines(dates ?? {});

    return {
      stage: { current, next, completed },
      health,
      progress,
      nextAction,
      deadlines,
    };
  }

  // ---------------------------------------------------------------------------
  // Health & Risk Logic
  // ---------------------------------------------------------------------------

  /**
   * Evaluate health and risk from a stage snapshot and progress.
   */
  private evaluateHealth(
    snapshot: TradeCaseStageSnapshot,
    progress: TradeCaseProgress,
  ): TradeCaseHealth {
    const current = resolveCurrentStage(snapshot);
    const next = resolveNextStage(snapshot);
    const completed = isCompleted(snapshot);

    // Health: if completed -> HEALTHY, else determine from risk
    const riskLevel = this.evaluateRiskLevel(snapshot, progress.overall);
    const status = completed
      ? 'HEALTHY'
      : this.mapRiskToHealth(riskLevel);

    return { status, riskLevel, currentStage: current, nextStage: next, completed };
  }

  /**
   * Determine risk level based on stage completeness and overall progress.
   *
   * Rules:
   *  - If no stages have data -> CRITICAL
   *  - If less than 40% progress -> HIGH
   *  - If 40-79% progress -> MEDIUM
   *  - If 80%+ progress -> LOW unless only commitment remains, then LOW
   */
  private evaluateRiskLevel(
    snapshot: TradeCaseStageSnapshot,
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

export default TradeCaseStateEngine;