# Workflow Engine Architecture

**Last Updated:** 2026-07-20  
**Baseline:** v0.1  

---

## 1. Purpose

The Workflow Engine is the conceptual core that drives the progression of trade cases through their lifecycle. It answers the question: *"Given the current state of a trade case, what should happen next?"*

### Why PTMS Needs a Workflow Engine

Without a workflow engine, trade case progression relies on manual oversight. Operators must monitor deadlines, detect missing data, identify blocked processes, and trigger the correct actions — all of which is error-prone and inconsistent across a large portfolio of trade cases.

The Workflow Engine replaces ad-hoc manual decision-making with a structured, rule-based, and auditable approach.

### Problems Solved

| Problem | Solution |
|---|---|
| **Inconsistent progression** | The engine applies the same rules and logic to every trade case uniformly |
| **Missed deadlines** | Time-based rules automatically detect approaching deadlines and generate reminders |
| **Hidden blockages** | Blocked processes are detected and escalated without manual intervention |
| **No audit trail** | Every decision the engine makes is recorded with full before/after state |
| **Manual coordination** | Tasks and notifications are created automatically based on rule evaluation |
| **Unclear next actions** | The engine determines and exposes the recommended next action for each trade case |

---

## 2. Workflow Engine Philosophy

The Workflow Engine is designed around five guiding principles.

### Event-Driven

The engine does not run on a continuous loop. It evaluates state and triggers actions only when an event occurs. Events may come from data imports, time progression, external confirmations, or operator actions. This ensures the engine is reactive and efficient — computation happens only when something changes.

### Data-Driven

Decisions are made based on the presence and values of business data, not on hard-coded logic that must be modified when business rules change. The engine evaluates "what data exists" and "what data is missing" to determine stage progression, completion status, and required actions. Changing a threshold or deadline duration does not require changing engine logic — only the underlying rule configuration.

### Rule-Based

The engine evaluates a set of business rules against the current trade case state. Each rule is an independent, testable condition that produces a pass/fail result. Rules are composable — multiple rules can be evaluated together to produce a comprehensive picture of trade case health, risk, and required actions.

### Observable

The engine exposes the full result of its evaluation — not just the recommended next action, but also the reasoning behind it. Stakeholders can see which rules passed, which failed, what triggered each decision, and what actions were generated. This transparency builds trust and enables manual verification when needed.

### Auditable

Every evaluation by the Workflow Engine is recorded immutably. The audit record captures who or what triggered the evaluation, what the state was before and after, which rules were evaluated, what decisions were made, and what actions were generated. This provides a complete, non-repudiable history of every trade case.

---

## 3. Core Concepts

The following concepts form the vocabulary of the Workflow Engine. Each is defined in business terms, independent of any implementation.

| Concept | Description |
|---|---|
| **Workflow** | The overall orchestration of a trade case from creation to completion. A workflow defines which stages exist, in what order they are processed, what rules apply at each stage, and what actions are available. |
| **Task** | A unit of work assigned to a specific actor or role within the workflow. A task has a priority, a deadline, and a definition of completion. Example: *"Submit origin certificates before the deadline."* |
| **Action** | An operation that changes the state of the workflow. Actions may be automatic (performed by the system) or manual (performed by a human actor). Example: *"Advance to the next stage."* |
| **Transition** | A valid move from one state or stage to another. Transitions are governed by rules and conditions. Not every state change is a valid transition — the engine enforces that only permitted transitions occur. |
| **Event** | Something that happens in the system or externally that triggers the Workflow Engine to evaluate state. Events are the input that drives all engine processing. |
| **Rule** | A business policy encoded as an evaluable condition. Rules produce a pass/fail result, optionally with a message and priority. Rules are the building blocks of workflow decision-making. |
| **Condition** | A Boolean evaluation performed against trade case state or data. Conditions may check data presence, value thresholds, time elapsed, or actor permissions. Multiple conditions may be combined to form rules. |
| **Decision** | The output of rule evaluation. A decision may be a state transition, a task creation, a notification, or an escalation. |
| **Approval** | A manual decision by an authorized actor that permits a workflow to proceed. Approvals may be required for certain transitions (e.g., allocation approval by a bank or manager). |
| **Escalation** | The elevation of a task, approval, or alert to a higher authority when the original assignee does not act within the required timeframe. |
| **Notification** | An informational message generated by the workflow to inform actors of required actions, state changes, or alerts. Notifications may be delivered in-system or via external channels. |

---

## 4. Workflow Execution Model

The execution model follows a logical sequence: receive input, process against rules and state, produce output.

```
┌─────────────────────────────────────────────────────────────┐
│                        INPUT                                 │
│                                                              │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │ Lifecycle    │  │ Business Data  │  │ External Signals │ │
│  │ Events       │  │ Changes        │  │ (Bank, Customs)  │ │
│  └──────────────┘  └────────────────┘  └──────────────────┘ │
│                                                              │
│  ┌──────────────────┐                                        │
│  │ Time Events      │                                        │
│  │ (Deadlines,      │                                        │
│  │  Scheduled Checks)│                                       │
│  └──────────────────┘                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      PROCESSING                              │
│                                                              │
│  1. Load current trade case state                            │
│  2. Evaluate all applicable rules                            │
│  3. Determine required actions                               │
│  4. Check transition validity                                │
│  5. Resolve conflicts and calculate priorities               │
│  6. Generate new state                                       │
│  7. Record audit trail                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                       OUTPUT                                 │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Updated          │  │ Tasks        │  │ Alerts and     │ │
│  │ Lifecycle State  │  │              │  │ Notifications  │ │
│  └──────────────────┘  └──────────────┘  └────────────────┘ │
│                                                              │
│  ┌──────────────────┐                                        │
│  │ Audit Records    │                                        │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### Input

| Input Type | Description | Examples |
|---|---|---|
| **Lifecycle Events** | Events generated by the lifecycle model when stages or statuses change | Stage completed, status changed, trade case created |
| **Business Data Changes** | Changes to the underlying business data that a trade case references | New allocation record imported, origin certificate registered |
| **External Signals** | Confirmations or responses from external systems | Bank approves allocation, customs clears declaration |
| **Time Events** | Scheduled checks based on elapsed time or calendar dates | Deadline approaching, overdue escalation trigger |

### Processing

The engine performs the following steps in sequence:

1. **Load state** — Retrieve the current snapshot of the trade case (which stages have data, current activity status, timestamps)
2. **Evaluate rules** — Run all applicable business rules against the current state to identify alerts, risks, and required actions
3. **Determine actions** — Based on rule results and current state, decide which actions must be taken (automatic or manual)
4. **Validate transitions** — Check that any proposed stage or status transition is valid according to the transition matrix
5. **Resolve conflicts** — If rules produce contradictory guidance, apply conflict resolution logic
6. **Generate output** — Produce the updated state snapshot, create tasks and notifications, and record the audit trail

### Output

| Output Type | Description |
|---|---|
| **Updated Lifecycle State** | The new current stage, next stage, activity status, health, risk, and progress after evaluation |
| **Tasks** | New tasks created as a result of rule evaluation or state changes |
| **Alerts** | Business rule alerts with priority levels, indicating conditions that require attention |
| **Notifications** | Messages to actors informing them of required actions, state changes, or alerts |
| **Audit Records** | Immutable records of what was evaluated, what decisions were made, and what the before/after state looked like |

---

## 5. Workflow Relationship With

The Workflow Engine does not exist in isolation. It interacts with several other domain concepts.

### Lifecycle

The **Lifecycle** defines the stages a trade case passes through and their ordering. The Workflow Engine consumes the lifecycle model to determine valid stage progression, evaluate completion criteria, and compute the current and next stage for any trade case.

The lifecycle provides the "map"; the Workflow Engine provides the "navigation."

### Stage

A **Stage** is a phase of the lifecycle (Registration, Allocation, Origin, Declaration, Commitment). The Workflow Engine evaluates whether a stage has data and whether it meets completion criteria. The engine determines the current stage (highest stage with data) and the next stage (lowest stage without data).

### Activity Status

The **Activity Status** (Draft, Active, Waiting, Blocked, Completed, Archived) describes the operational posture of a trade case. The Workflow Engine evaluates conditions to determine whether the status should change. For example:
- If all five stages have data → status becomes **Completed**
- If external dependency is detected → status becomes **Waiting**
- If systemic issue prevents progress → status becomes **Blocked**

### State Engine

The **State Engine** produces state snapshots for each trade case. The Workflow Engine consumes these snapshots as input and produces updated snapshots as output. The state engine is the data layer; the Workflow Engine is the decision layer.

### Business Rules

**Business Rules** are the policies and policies that evaluate trade case health, risk, and alert conditions. The Workflow Engine executes business rules against the current state and uses their results to guide decision-making. Rules are independent of the engine and can be added, removed, or modified without changing engine behavior.

### Audit System

The **Audit System** stores immutable records of all state changes, rule evaluations, and decisions. The Workflow Engine writes to the audit system after every evaluation. The audit system provides traceability and accountability for all automated decisions.

---

## 6. Workflow Actors

Actors are the entities that interact with the workflow — either as the source of events or as the recipients of tasks and notifications.

| Actor | Role in the Workflow |
|---|---|
| **System** | Performs automatic actions: deadline checks, rule evaluation, state transitions, alert generation. The system is the primary executor of the Workflow Engine. |
| **Trade Manager** | Owns and manages a portfolio of trade cases. Reviews alerts, responds to notifications, takes manual actions (approve, reject, override), and ensures cases progress. |
| **Commercial Employee** | Initiates trade cases and submits operational data. Responds to requests for missing documents or information. The primary creator of business data that drives the workflow. |
| **Finance User** | Handles allocation requests and commitment settlements. Participates in approval workflows for financial transactions. |
| **Management** | Reviews escalated cases and high-priority alerts. Authorizes exceptions and overrides. Provides oversight of workflow performance and bottlenecks. |
| **External Systems** | Banks, customs authorities, and other external entities that send confirmations and signals. The workflow reacts to these signals but does not control them. |

---

## 7. Automatic Actions

Automatic actions are performed by the system without human intervention. They are triggered by rule evaluation results or time events.

| Action | Trigger | Effect |
|---|---|---|
| **Move stage after completion criteria met** | All data for the current stage is present and validated | The trade case advances to the next stage |
| **Create reminder before deadline** | A stage deadline is approaching (configurable threshold, e.g., 7 days before expiry) | A task is created for the responsible actor to complete the required work |
| **Detect blocked process** | A stage has been active beyond its expected duration with no progress | The activity status changes to Blocked and an alert is generated |
| **Request missing document** | A stage requires data that has not been provided | A notification is sent to the responsible actor with details of what is missing |
| **Generate alert** | A business rule evaluation produces a failure | An alert is created with the rule identifier, message, and computed priority |
| **Escalate overdue task** | A task or approval deadline passes without completion | The task is escalated to the next level of authority |
| **Update activity status** | A condition for status change is detected (e.g., external dependency) | The activity status is updated with the reason stored as metadata |

---

## 8. Manual Actions

Manual actions require a human actor to make a decision. These actions are typically presented to the user via tasks or approval requests.

| Action | Description | Required By |
|---|---|---|
| **Approve** | Authorize a workflow step to proceed (e.g., approve an allocation request) | Trade Manager, Finance User, Management |
| **Reject** | Deny a workflow step. The trade case remains in its current state with a rejection record. | Trade Manager, Finance User, Management |
| **Override** | Force a state transition or decision that the Workflow Engine would not normally allow. Overrides are exceptional and must be recorded with a reason. | Management |
| **Cancel** | Terminate a trade case. The case is moved to a cancelled state and no further processing occurs. | Trade Manager, Management |
| **Reopen** | Return a completed or archived trade case to an active state. Reopen is exceptional and must be recorded with a reason. | Management |
| **Assign** | Manually assign a task to a specific actor when automatic assignment is not appropriate. | Trade Manager |
| **Defer** | Postpone a task or deadline with a reason and new expected date. | Trade Manager |

---

## 9. Decision Model

The decision model defines how the Workflow Engine evaluates conditions, executes rules, and determines the correct course of action.

### Condition Evaluation

A condition is the smallest unit of decision logic. Conditions are Boolean evaluations on trade case state or data.

| Condition Type | Examples |
|---|---|
| **Data presence** | Does registration data exist? Is an allocation record present? |
| **Value comparison** | Is remaining allocation above the threshold? Is the deadline within 7 days? |
| **Time comparison** | Has the stage been active for more than the expected duration? |
| **State comparison** | Is the current stage equal to Allocation? Is the activity status Active? |
| **Composite** | Is registration complete AND is allocation missing? (AND/OR/NOT combinations) |

### Rule Execution

Rules are composed of one or more conditions. When the engine evaluates a trade case, it executes all applicable rules in sequence.

1. Each rule evaluates its conditions against the current trade case state
2. Each rule produces a result: **Pass** (no action needed) or **Fail** (alert/action required)
3. A failing rule includes a message explaining the failure and a priority level
4. Rules may be skipped if preconditions are not met (e.g., skip remaining allocation rules if the case is already Completed)

### Priority Calculation

When a rule fails, the resulting alert or action is assigned a priority. Priority is calculated based on:

| Factor | Influence |
|---|---|
| **Magnitude** | How far out of compliance is the condition? (e.g., how much allocation remains) |
| **Time sensitivity** | How close is the deadline? |
| **Business impact** | What is the potential financial or regulatory consequence? |
| **Stage criticality** | Some stages may have higher inherent priority than others |

Priorities follow a standard scale: Low, Medium, High, Critical.

### Conflict Resolution

When multiple rules produce contradictory guidance, the engine applies conflict resolution logic:

1. **Highest priority wins** — A Critical alert overrides a Low-priority recommendation
2. **Most specific rule wins** — A rule specific to the current stage takes precedence over a general rule
3. **Safety-first** — When in doubt, the engine favours blocking progression over allowing an invalid state
4. **Manual override** — An operator decision always overrides an automated recommendation

If conflicts cannot be resolved automatically, the engine escalates to a human operator with full context.

---

## 10. Task Management Concept

Tasks are the mechanism by which the Workflow Engine assigns work to actors. A task represents a discrete unit of work that must be completed for the workflow to progress.

### Task Creation

Tasks are created automatically by the Workflow Engine when a rule evaluation determines that human action is required. Each task is created with:
- A description of what needs to be done
- The actor or role responsible
- A priority
- A deadline
- A reference to the trade case and stage that generated it

### Assignment

Tasks may be assigned to:
- A **specific actor** (e.g., the Trade Manager who owns the trade case)
- A **role** (e.g., any Finance User with the appropriate permissions)
- A **group** (e.g., the Commercial team)

If the assigned actor does not complete the task within the deadline, the task is escalated.

### Priority

Each task carries a priority that determines its urgency relative to other tasks. Priority is inherited from the rule that created the task and may be recalculated as the deadline approaches.

### Deadline

Every task has a deadline calculated by the Workflow Engine based on the business rules that created it. Deadlines are:
- **Fixed** — A specific date and time (e.g., "before the allocation expiry date")
- **Relative** — A duration from the task creation time (e.g., "within 3 business days")

### Completion

A task is complete when the required action has been taken. Completion may be:
- **Automatic** — The task is resolved when the condition that created it is satisfied (e.g., data is imported, eliminating the "missing document" task)
- **Manual** — The actor marks the task as complete after performing the required action

### Escalation

When a task's deadline passes without completion:
1. The task priority is increased
2. A notification is sent to the original assignee
3. If still not completed after a configured grace period, the task is escalated to the next level of authority
4. Escalation continues up the chain until the task is completed or a manager intervenes

---

## 11. Approval Workflow

Certain workflow transitions require explicit approval before they can proceed. The approval workflow governs how these approvals are requested, processed, and recorded.

### Approval Request

An approval request is created when:
- A workflow transition requires authorization (e.g., moving from Allocation to Origin after bank approval)
- A financial limit is exceeded (e.g., allocation amount above threshold)
- An exception or override is requested

The approval request captures:
- What is being requested
- Who requested it
- What the current state is
- What the proposed next state is
- Any supporting data or rationale

### Approval Chain

Approvals may require a sequence of authorizations before they are considered complete:

| Level | Approver | Scope |
|---|---|---|
| 1 | Trade Manager | Standard approvals within normal limits |
| 2 | Finance User | Financial approvals and allocation authorizations |
| 3 | Management | Exceptions, overrides, and high-value approvals |
| 4 | Director | Critical or regulatory-sensitive decisions |

An approval chain is satisfied when all required levels have approved. If any level rejects, the approval request fails and the workflow does not proceed.

### Approval Delegation

An approver may delegate their approval authority to another actor:
- **Temporary delegation** — For a defined period (e.g., during leave)
- **Permanent delegation** — For a specific role or trade case category
- **Emergency delegation** — When the primary approver is unavailable

All delegations are recorded in the audit trail.

### Approval History

Every approval action is recorded immutably:

| Data Point | Description |
|---|---|
| **Approval ID** | Unique identifier for the approval request |
| **Requester** | Who requested the approval |
| **Approver** | Who made the decision |
| **Decision** | Approve or Reject |
| **Timestamp** | When the decision was made |
| **Reason** | Rationale for the decision (required for rejections) |
| **Before State** | The state before the approval decision |
| **After State** | The state after the approval decision |

---

## 12. Error and Exception Handling

The Workflow Engine must handle errors and exceptions gracefully, ensuring that unexpected conditions do not result in data loss or incorrect state.

### Missing Data

| Scenario | Handling |
|---|---|
| Stage has no data when evaluation occurs | Engine treats the stage as not yet started; no alerts generated for data absence |
| Required data for a rule is missing | Rule is skipped with a warning recorded in the audit trail |
| Data is present but incomplete | Engine evaluates based on available data; incompleteness may trigger a "missing information" alert |

### Invalid Transition

| Scenario | Handling |
|---|---|
| Attempt to skip a stage | Engine rejects the transition; records attempted transition in audit trail |
| Attempt to regress to an earlier stage | Engine rejects the transition; generates an alert for the operator |
| Attempt to transition from a terminal state | Engine rejects the transition; no further action possible |

### External Failure

| Scenario | Handling |
|---|---|
| External system is unavailable | Engine records the failure; sets status to Waiting with reason "external system unavailable" |
| External signal is malformed | Engine disregards the signal; generates an alert for operator review |
| External confirmation is delayed | Engine continues with standard processing; deadline escalation may trigger if delay exceeds thresholds |

### Manual Intervention

When the Workflow Engine cannot resolve a situation automatically, it raises an alert requesting manual intervention:

| Cause | Intervention Required |
|---|---|
| Unresolvable rule conflict | Operator reviews conflicting rules and makes a manual decision |
| External system failure persists | Operator processes the trade case manually outside the workflow |
| Boundary condition not covered by rules | Operator determines the correct action and records it for future rule improvement |
| Security or compliance concern | Management reviews and decides on appropriate action |

All manual interventions are recorded with the operator identity, reason, and before/after state.

---

## 13. Audit Requirements

Every evaluation by the Workflow Engine must produce an immutable audit record. The following data points must be captured:

| Data Point | Description | Required |
|---|---|---|
| **Who** | The actor or system that triggered the evaluation | Always |
| **When** | The timestamp of the evaluation | Always |
| **Why** | The event or trigger that caused the evaluation | Always |
| **Before State** | The complete state snapshot before evaluation | Always |
| **After State** | The complete state snapshot after evaluation | Always |
| **Triggered Event** | The specific event that caused the evaluation | Always |
| **Rules Evaluated** | Which rules were evaluated and their individual results | Always |
| **Decisions Made** | What decisions were taken (transitions, task creations, notifications) | Always |
| **Actions Generated** | What actions were created (tasks, alerts, approvals) | Always |
| **Errors or Warnings** | Any errors, warnings, or skipped rules encountered during evaluation | If applicable |
| **Manual Override Reason** | If an operator override was applied, the reason provided | If applicable |
| **External References** | Any external confirmation IDs or references related to the evaluation | If applicable |

### Audit Record Immutability

- Audit records must never be modified or deleted after creation
- Any correction to a prior evaluation must be recorded as a new audit entry that references the previous entry
- The audit trail must be queryable by trade case, actor, date range, and event type

---

## 14. Future Extensions

The following capabilities are expected future extensions of the Workflow Engine. They are noted here to ensure the current architecture does not preclude them.

### Parallel Workflows

The current model assumes linear stage progression. Future extensions may support:
- Parallel stages (multiple stages active simultaneously)
- Conditional branching (different paths based on trade case type or data)
- Looping or rework (returning to a previous stage for corrections)

### AI Recommendations

Machine learning models may be integrated to:
- Predict risk of delay or failure for each trade case
- Recommend optimal priority ordering for tasks
- Suggest rule threshold adjustments based on historical patterns
- Detect anomalies in workflow progression

### External Workflow Integration

The Workflow Engine may need to integrate with external workflow systems:
- Connect with bank workflow systems for allocation approvals
- Interface with customs authority systems for declaration processing
- Integrate with enterprise workflow platforms for cross-system orchestration

### Configurable Workflows

Business users may be empowered to configure workflow behaviour without technical intervention:
- Adjust stage durations and deadline thresholds
- Configure which rules apply to which trade case types
- Define custom approval chains for different scenarios
- Set notification preferences and escalation paths

### No-Code Workflow Designer

A visual workflow designer would allow business analysts to:
- Define new workflow stages and transitions graphically
- Configure rules and conditions through a visual interface
- Test workflow behaviour against historical data
- Deploy workflow changes without code releases

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **Action** | An operation that changes the state of the workflow, either automatic or manual |
| **Actor** | An entity (system or human) that interacts with the workflow |
| **Alert** | A notification generated when a business rule identifies a condition requiring attention |
| **Approval** | A manual decision authorizing a workflow step to proceed |
| **Condition** | A Boolean evaluation on trade case state or data |
| **Decision** | The output of rule evaluation that determines what actions to take |
| **Escalation** | Elevation of a task or approval to a higher authority due to delay or exception |
| **Event** | An occurrence that triggers the Workflow Engine to evaluate state |
| **Notification** | An informational message delivered to an actor |
| **Rule** | A business policy encoded as an evaluable condition with a pass/fail result |
| **Stage** | A phase of the trade case lifecycle |
| **State** | The complete snapshot of a trade case at a point in time |
| **Task** | A unit of work assigned to an actor with a priority and deadline |
| **Transition** | A valid move from one state or stage to another |
| **Workflow** | The overall orchestration of a trade case from creation to completion |

---

## Appendix B: Document References

| Document | Reference |
|---|---|
| Trade Case Lifecycle Architecture | Defines the lifecycle stages, activity statuses, transition matrix, and events consumed by the Workflow Engine |
| Current Architecture | Provides the overall system context in which the Workflow Engine operates |