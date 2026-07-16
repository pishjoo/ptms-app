/**
 * Classifies a single entity record into one of four categories
 * for the execution plan.
 */
export type EntityAction = 'CREATE' | 'UPDATE' | 'IGNORE';

/**
 * Describes a single entity record and how it should be handled
 * during the import persistence phase.
 */
export interface EntityExecutionItem {
  /** The sheet/entity type (e.g. "allocation", "origin"). */
  readonly entityType: string;

  /** The registration number this entity belongs to. */
  readonly registrationNumber: string;

  /** The action to perform on this entity. */
  readonly action: EntityAction;

  /** The record data to persist. */
  readonly data: Readonly<Record<string, unknown>>;

  /** The previous record data if updating (null for new entities). */
  readonly previousData: Readonly<Record<string, unknown>> | null;

  /** Fields that were changed (empty for new entities). */
  readonly changedFields: readonly string[];
}

/**
 * Describes a manual field that should be preserved (not overwritten)
 * during the import persistence phase.
 */
export interface ManualFieldPreservation {
  /** The registration number this field belongs to. */
  readonly registrationNumber: string;

  /** The entity type this field belongs to. */
  readonly entityType: string;

  /** The field name that should be preserved. */
  readonly fieldName: string;

  /** The current (existing) value to preserve. */
  readonly currentValue: unknown;
}

/**
 * The execution plan is produced by the approval engine after a decision
 * is made. It classifies every record from the import preview into:
 *
 * - entities to create (new records that do not exist in the database)
 * - entities to update (existing records with changed fields)
 * - entities to ignore (records that are unchanged or removed)
 * - manual fields to preserve (fields that should NOT be overwritten
 *   because they contain user-entered data in the database)
 *
 * This plan is an in-memory structure. It MUST NOT write to the database.
 */
export interface ExecutionPlan {
  /** All entities that should be created in the database. */
  readonly entitiesToCreate: readonly EntityExecutionItem[];

  /** All entities that should be updated in the database. */
  readonly entitiesToUpdate: readonly EntityExecutionItem[];

  /** All entities that should be ignored (no database action required). */
  readonly entitiesToIgnore: readonly EntityExecutionItem[];

  /** Fields in existing records that must be preserved from overwrite. */
  readonly manualFieldsToPreserve: readonly ManualFieldPreservation[];

  /** The approval decision that produced this plan. */
  readonly approved: boolean;

  /** ISO-8601 timestamp of when this plan was created. */
  readonly createdAt: string;
}

export default ExecutionPlan;