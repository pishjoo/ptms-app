/**
 * Represents the five operational stages of a trade case lifecycle.
 */
export type TradeCaseStage =
  | 'REGISTRATION'
  | 'ALLOCATION'
  | 'ORIGIN'
  | 'DECLARATION'
  | 'COMMITMENT'
  | 'COMPLETED';

/**
 * Human-readable labels for each stage.
 */
export const STAGE_LABELS: Record<TradeCaseStage, string> = {
  REGISTRATION: 'Registration',
  ALLOCATION: 'Allocation',
  ORIGIN: 'Origin',
  DECLARATION: 'Declaration',
  COMMITMENT: 'Commitment',
  COMPLETED: 'Completed',
};

/**
 * Ordered list of stages (excluding COMPLETED) used for progression logic.
 */
export const STAGE_ORDER: readonly Exclude<TradeCaseStage, 'COMPLETED'>[] = [
  'REGISTRATION',
  'ALLOCATION',
  'ORIGIN',
  'DECLARATION',
  'COMMITMENT',
];

/**
 * Determine the current stage based on available imported data.
 */
export function resolveCurrentStage(snapshot: TradeCaseStageSnapshot): TradeCaseStage {
  if (snapshot.hasCommitment) return 'COMMITMENT';
  if (snapshot.hasDeclaration) return 'DECLARATION';
  if (snapshot.hasOrigin) return 'ORIGIN';
  if (snapshot.hasAllocation) return 'ALLOCATION';
  if (snapshot.hasRegistration) return 'REGISTRATION';
  return 'REGISTRATION';
}

/**
 * Determine the next expected stage based on available imported data.
 */
export function resolveNextStage(snapshot: TradeCaseStageSnapshot): TradeCaseStage {
  if (!snapshot.hasRegistration) return 'REGISTRATION';
  if (!snapshot.hasAllocation) return 'ALLOCATION';
  if (!snapshot.hasOrigin) return 'ORIGIN';
  if (!snapshot.hasDeclaration) return 'DECLARATION';
  if (!snapshot.hasCommitment) return 'COMMITMENT';
  return 'COMPLETED';
}

/**
 * Determine if all five stages have data (i.e., the case is completed).
 */
export function isCompleted(snapshot: TradeCaseStageSnapshot): boolean {
  return (
    snapshot.hasRegistration &&
    snapshot.hasAllocation &&
    snapshot.hasOrigin &&
    snapshot.hasDeclaration &&
    snapshot.hasCommitment
  );
}

/**
 * Data snapshot used to evaluate stage transitions.
 * Each flag indicates whether meaningful data exists for that stage.
 */
export interface TradeCaseStageSnapshot {
  readonly hasRegistration: boolean;
  readonly hasAllocation: boolean;
  readonly hasOrigin: boolean;
  readonly hasDeclaration: boolean;
  readonly hasCommitment: boolean;
}

export default TradeCaseStage;