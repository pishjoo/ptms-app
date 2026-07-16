/**
 * Calculated summary for a trade case.
 */
export interface TradeCaseSummary {
  /**
   * Unique identifier of the trade case.
   */
  readonly tradeCaseId: string;

  /**
   * Registration number assigned to the trade case.
   */
  readonly registrationNumber: string | null;

  /**
   * Company name associated with the trade case.
   */
  readonly companyName: string;

  /**
   * Current status of the trade case.
   */
  readonly currentStatus: string;

  /**
   * Progress percentage for the trade case.
   */
  readonly progress: number;

  /**
   * Risk level for the trade case.
   */
  readonly risk: number;

  /**
   * Approved allocation amount.
   */
  readonly approvedAllocation: number;

  /**
   * Remaining allocation amount.
   */
  readonly remainingAllocation: number;

  /**
   * Registered origin amount.
   */
  readonly registeredOrigin: number;

  /**
   * Remaining origin amount.
   */
  readonly remainingOrigin: number;

  /**
   * Declared amount.
   */
  readonly declaredAmount: number;

  /**
   * Remaining declaration amount.
   */
  readonly remainingDeclaration: number;

  /**
   * Commitment cleared amount.
   */
  readonly commitmentCleared: number;

  /**
   * Remaining commitment amount.
   */
  readonly remainingCommitment: number;

  /**
   * Count of warnings generated for the trade case.
   */
  readonly warningsCount: number;

  /**
   * Count of upcoming deadlines for the trade case.
   */
  readonly upcomingDeadlinesCount: number;

  /**
   * Timestamp of the last activity related to the trade case.
   */
  readonly lastActivity: Date | null;

  /**
   * User assigned to the trade case.
   */
  readonly assignedUser: string | null;
}
