import type { TradeCaseStage } from './trade-case-stage';
import { STAGE_ORDER } from './trade-case-stage';

/**
 * Per-stage completion percentage (0–100).
 */
export interface StageProgress {
  readonly registration: number;
  readonly allocation: number;
  readonly origin: number;
  readonly declaration: number;
  readonly commitment: number;
}

/**
 * Overall progress evaluation for a trade case.
 */
export interface TradeCaseProgress {
  /** Overall completion percentage (0–100). */
  readonly overall: number;

  /** Per-stage completion percentages. */
  readonly stages: StageProgress;

  /** The current stage the case is in. */
  readonly currentStage: TradeCaseStage;

  /** The next expected stage. */
  readonly nextStage: TradeCaseStage;
}

/**
 * Build a TradeCaseProgress from a stage snapshot.
 *
 * Each stage is scored 0 or 100 based on whether meaningful data exists.
 * The overall percentage is the average across all five stages.
 */
export function computeProgress(snapshot: {
  hasRegistration: boolean;
  hasAllocation: boolean;
  hasOrigin: boolean;
  hasDeclaration: boolean;
  hasCommitment: boolean;
  currentStage: TradeCaseStage;
  nextStage: TradeCaseStage;
}): TradeCaseProgress {
  const registration = snapshot.hasRegistration ? 100 : 0;
  const allocation = snapshot.hasAllocation ? 100 : 0;
  const origin = snapshot.hasOrigin ? 100 : 0;
  const declaration = snapshot.hasDeclaration ? 100 : 0;
  const commitment = snapshot.hasCommitment ? 100 : 0;

  const overall = Math.round(
    (registration + allocation + origin + declaration + commitment) / STAGE_ORDER.length,
  );

  return {
    overall,
    stages: { registration, allocation, origin, declaration, commitment },
    currentStage: snapshot.currentStage,
    nextStage: snapshot.nextStage,
  };
}

export default TradeCaseProgress;