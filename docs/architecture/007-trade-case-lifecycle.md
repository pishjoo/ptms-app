# Trade Case Lifecycle Architecture

**Last Updated:** 2026-07-20  
**Baseline:** v0.1  

---

## 1. Overview

The trade case lifecycle describes the operational progression of an import/export trade case through five sequential stages. Each stage represents a distinct business activity that must be completed before the trade case advances.

The lifecycle is evaluated by a **Workflow Engine** — a domain component that consumes data about what is known for each stage and produces a snapshot of the trade case's current state, including its health, progress, next required action, and deadline status.

---

## 2. Lifecycle Model

```
   REGISTRATION ──→ ALLOCATION ──→ ORIGIN ──→ DECLARATION ──→ COMMITMENT ──→ COMPLETED
```

### Stage Definitions

| Stage | Business Name | Description |
|---|---|---|
| **Registration** | Registration Order | The trade case is registered with the relevant authority. A registration number is assigned, and the company initiating the trade is identified. |
| **Allocation** | Currency Allocation | A currency allocation is requested and approved for the trade. This stage may involve bank approval. |
| **Origin** | Origin Registration | Origin certificates are registered against the allocated amount, proving the goods originate from a qualifying country. |
| **Declaration** | Customs Declaration | Customs declarations are submitted for the goods, declaring their value, classification, and origin. |
| **Commitment** | Commitment Settlement | Financial commitments are settled against the declared amounts. |
| **Completed** | Terminal State | All five operational stages have been fulfilled. No further actions are required. |

### Key Design Decisions

- **Linear progression** — Stages advance in a fixed order. Parallel or skipped stages are not supported within the current model.
- **Data-driven** — A stage is considered present when meaningful business data exists for it. Stage presence is not determined by explicit status transitions.
- **Terminal state** — `Completed` is the only terminal state. Once all five stages are fulfilled, the trade case is completed. No further state transitions are possible from this point.

---

## 3. Activity Status

The activity status is a business-level classification of the trade case's operational posture. It is independent of the stage and provides context for how the trade case should be treated by business rules.

### Canonical Statuses

| Status | Meaning |
|---|---|
| **Draft** | The trade case is being prepared. No operational activity has started. |
| **Active** | The trade case is actively progressing through the workflow. Data exists for at least one stage, and the case is moving forward. |
| **Waiting** | The trade case is awaiting an external input or confirmation. The reason for waiting may vary (bank approval, customs clearance, external approval, missing documents, etc.), but the reason is contextual metadata — not a separate status. |
| **Blocked** | The trade case cannot proceed due to a dependency, exception, or external factor that prevents advancement. |
| **Completed** | All five operational stages have been fulfilled. The trade case is finished. |
| **Archived** | The trade case is closed and no longer actionable. Archived cases are retained for audit and reference. |

### Status Assignment Rules

- **Draft** is the initial status when a trade case is created but no data has been imported.
- **Active** is the default status when operational data exists and no blocking or waiting conditions are detected.
- **Waiting** is assigned when the trade case is known to be dependent on an external party or event. The specific reason (bank, customs, documents) is stored as metadata alongside the status.
- **Blocked** is assigned when a systemic issue prevents progress (e.g., a dependency service is unavailable, regulatory hold).
- **Completed** is assigned when all five stages have data.
- **Archived** is assigned after a completed trade case has been closed out by an operator.

### Important Distinction

Activity status is distinct from the operational stage. A trade case may be in the **Allocation** stage with an **Active** status (proceeding normally), or in the **Allocation** stage with a **Waiting** status (awaiting bank approval). The stage describes what needs to be done; the status describes whether it can be done.

---

## 4. Transition Matrix

### Stage Transitions

A trade case progresses from one stage to the next when the current stage's data exists and the next stage's data is absent. The following transitions are valid:

| From | To | Condition |
|---|---|---|
| (None / Draft) | Registration | Registration data is provided |
| Registration | Allocation | Registration data exists AND allocation data is provided |
| Allocation | Origin | Allocation data exists AND origin data is provided |
| Origin | Declaration | Origin data exists AND declaration data is provided |
| Declaration | Commitment | Declaration data exists AND commitment data is provided |
| Commitment | Completed | All five stages have data |

### Activity Status Transitions

| From | To | Trigger |
|---|---|---|
| Draft | Active | First operational data is received |
| Active | Waiting | External dependency detected (bank, customs, etc.) |
| Waiting | Active | External dependency resolved |
| Active / Waiting | Blocked | Systemic or regulatory exception raised |
| Blocked | Active / Waiting | Blocking condition resolved |
| Any (except Archived) | Completed | All five stages fulfilled |
| Completed | Archived | Operator closes the trade case |
| Archived | — | No transitions out of Archived |

### Invalid Transitions

The following transitions must never occur:

| Invalid Transition | Reason |
|---|---|
| Skipping a stage (e.g., Registration → Declaration) | Each stage must be completed in order |
| Regression to an earlier stage (e.g., Declaration → Allocation) | Trade cases cannot go backwards |
| Transition from Completed to any other status | Completed is terminal |
| Transition from Archived to any other status | Archived is terminal |

---

## 5. Events

Each valid transition SHOULD emit a domain event. The following events are defined for the lifecycle:

| Event | Trigger | Payload |
|---|---|---|
| `TradeCaseCreated` | First data received for a trade case | Trade case identifier, company, registration number |
| `StageCompleted` | A stage transitions from incomplete to complete | Trade case identifier, stage name, timestamp |
| `TradeCaseCompleted` | All five stages are fulfilled | Trade case identifier, completion timestamp |
| `StatusChanged` | Activity status changes (Active, Waiting, Blocked, Completed, Archived) | Trade case identifier, previous status, new status, reason |
| `DeadlineWarningRaised` | A stage deadline is approaching or has passed | Trade case identifier, stage name, days remaining, severity |
| `AlertGenerated` | A business rule evaluation produces an alert | Trade case identifier, rule identifier, priority, message |

---

## 6. Actors

The following actors interact with the trade case lifecycle:

| Actor | Role | Actions |
|---|---|---|
| **Trader / Importer** | Initiates and progresses the trade case | Submits registration, requests allocation, provides origin certificates, submits declarations, settles commitments |
| **Bank** | Provides currency allocation and handles settlements | Approves allocation, processes commitment settlement |
| **Customs Authority** | Processes declarations | Receives and clears customs declarations |
| **System Operator** | Manages and monitors trade cases | Reviews alerts, resolves blocks, closes completed cases, archives |
| **Workflow Engine** | Automated domain component | Evaluates state, computes progress, detects deadlines, generates alerts |

---

## 7. Triggers

The lifecycle advances in response to specific triggers:

| Trigger | Effect | Source |
|---|---|---|
| **Data Import** | Stage data is received via batch import (e.g., Excel upload) | Import Pipeline (External) |
| **External Confirmation** | An external party confirms completion of a step (bank approval, customs clearance) | Bank / Customs (External) |
| **Operator Action** | A system operator manually advances or adjusts a trade case | System Operator |
| **Time Progression** | Deadlines advance based on elapsed time since a stage started | Workflow Engine (Automated) |
| **Condition Resolution** | A blocking or waiting condition is resolved | External / Operator |

---

## 8. Completion Criteria

A stage is considered complete when meaningful business data exists for that stage:

| Stage | Completion Criterion |
|---|---|
| Registration | A registration order record exists with a registration number |
| Allocation | One or more allocation records exist with approved amounts |
| Origin | One or more origin certificate records exist |
| Declaration | One or more customs declaration records exist |
| Commitment | One or more commitment settlement records exist |

The trade case as a whole is considered **Completed** when all five stages meet their completion criteria.

---

## 9. Invariants

The following business rules MUST always hold true for any trade case in the system:

| # | Invariant | Description |
|---|---|---|
| 1 | **Strict ordering** | A stage cannot be fulfilled before the preceding stage has data |
| 2 | **No regression** | Once a stage has data, it cannot be removed or rolled back to cause a regression |
| 3 | **Terminal state** | A Completed trade case cannot transition to any other stage or status (except Archived) |
| 4 | **Archived is final** | An Archived trade case cannot be reactivated |
| 5 | **Single active status** | A trade case has exactly one activity status at any point in time |
| 6 | **Status independence** | Activity status and operational stage are independent dimensions; any combination should be valid |
| 7 | **Completion finality** | All five stages must be fulfilled before a trade case can be marked Completed |

---

## 10. Audit Requirements

The following audit records MUST be maintained for the trade case lifecycle:

| Audit Record | Details |
|---|---|
| Stage transitions | Which stage was entered/exited, when, and what triggered it |
| Status changes | Previous status, new status, reason, operator (if applicable), timestamp |
| Data imports | Which records were imported for each stage, source file, timestamp |
| Deadline evaluations | Deadline check results, days remaining, severity at each evaluation point |
| Business rule evaluations | Which rules were evaluated, pass/fail result, priority, timestamp |
| Operator actions | Who performed what action, when, and any notes |
| External confirmations | Which external party confirmed what, timestamp |

All audit records MUST be immutable. No audit trail may be modified or deleted after creation.

---

## 11. Workflow Engine Foundation

The **Workflow Engine** is a domain component that evaluates the current state of a trade case. It does not interact with external systems, databases, or user interfaces. It is purely a computation engine.

### Input

The engine requires two inputs:
1. **Data snapshot** — Boolean flags indicating whether each of the five stages has data
2. **Timestamps** — Optional start dates for each stage to support deadline evaluation

### Output

The engine produces a comprehensive state result containing:

| Output | Description |
|---|---|
| **Current Stage** | The highest stage for which data exists |
| **Next Stage** | The earliest stage that is still missing data |
| **Completion Status** | Whether all five stages are fulfilled |
| **Health** | An evaluation of operational health (Healthy, Needs Attention, Critical) based on progress and completeness |
| **Risk** | An assessment of risk level based on the number of completed stages and overall progress |
| **Progress** | Overall completion percentage and per-stage completion flags |
| **Next Action** | The recommended next action based on which stage is missing |
| **Deadline Status** | Per-stage deadline evaluation including days remaining, expiry status, and warning level |

### Processing Rules

1. The engine evaluates stages in fixed order: Registration → Allocation → Origin → Declaration → Commitment
2. The current stage is the highest stage with data present
3. The next stage is the lowest stage without data present
4. The case is complete only when all five stages have data
5. Health degrades as fewer stages are complete:
   - No stages complete → Critical
   - Fewer than 40% complete → High Risk
   - 40–79% complete → Medium Risk
   - 80% or more complete → Low Risk (or Healthy if complete)
6. The next action corresponds to the first missing stage
7. Deadlines are calculated per-stage using configurable allowed durations and a warning threshold before expiry

### Quality Attributes

- **Deterministic** — Given the same inputs, the engine always produces the same output
- **Stateless** — The engine holds no internal state; all state is passed in and returned
- **Framework-independent** — The engine has no dependency on any framework, database, or external service

---

## 12. Business Rules (Domain Invariants)

Business rules evaluate the trade case state snapshot against operational policies. These rules generate alerts when conditions are violated. The following categories of rules exist:

| Rule Category | Purpose | Evaluation Logic |
|---|---|---|
| **Registration Expiry** | Detects trade cases in Registration with remaining obligations that have passed their expected duration | Fails if case is not Completed AND remaining obligations exist |
| **Allocation Expiry** | Detects trade cases in Allocation with remaining obligations that have passed their expected duration | Fails if case is not Completed AND remaining obligations exist |
| **Remaining Allocation** | Flags trade cases with unusually high unused allocation amounts | Fails if remaining allocation exceeds configured thresholds |
| **Remaining Origin** | Flags trade cases with unusually high unregistered origin amounts | Fails if remaining origin exceeds configured thresholds |
| **Remaining Declaration** | Flags trade cases with unusually high undeclared amounts | Fails if remaining declaration exceeds configured thresholds |
| **Remaining Commitment** | Flags trade cases with unusually high uncleared commitment amounts | Fails if remaining commitment exceeds configured thresholds |

All business rules share a common pattern:
1. Skip evaluation if the trade case is Completed (completed cases do not generate alerts)
2. Evaluate the relevant data against configured thresholds
3. Return a pass/fail result with a message and priority

---

## 13. Priority Model

Trade case alerts carry a business priority that determines their urgency:

| Priority | Meaning |
|---|---|
| **Low** | Informational. No action required. |
| **Medium** | Requires attention but not urgent. |
| **High** | Requires prompt attention. |
| **Critical** | Requires immediate action. |

Priority is computed based on the magnitude of remaining obligations across origin, declaration, and commitment. Larger remaining obligations result in higher priority.

---

## 14. Known Limitations

1. **Linear-only progression** — The model does not support parallel or overlapping stages. Real-world trade cases may have concurrent activities.
2. **No timeline tracking** — The model evaluates current data presence but does not record when each stage transition occurred.
3. **Manual archival** — There is no automatic archival policy; archival requires operator action.
4. **External dependency abstraction** — The model treats all external dependencies (bank, customs, documents) uniformly under the `Waiting` status. Distinguishing between different waiting reasons is handled via metadata, not status values.