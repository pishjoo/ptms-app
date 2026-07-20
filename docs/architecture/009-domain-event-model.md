# Domain Event Model

**Last Updated:** 2026-07-20  
**Baseline:** v0.1  

---

## 1. Purpose

The Domain Event Model defines the vocabulary and structure for how PTMS records, communicates, and reacts to business facts. A domain event is a record of something that happened in the system that is meaningful to the business — not a technical notification, but a business statement.

### Why PTMS Needs a Domain Event Model

Without a formal event model, components communicate implicitly. A data import may change a trade case's state, but there is no explicit record of *why* the state changed, *who* triggered it, or *what* other parts of the system should do in response. This leads to tightly coupled components, hidden side effects, and an incomplete audit trail.

The Domain Event Model makes the flow of business facts explicit. Every meaningful occurrence is captured as an event, published to interested consumers, and recorded permanently.

### Problems Solved

| Problem | Solution |
|---|---|
| **Tight coupling** | Producers and consumers are decoupled — a producer emits events without knowing who will consume them |
| **Implicit state changes** | Every state change is preceded by an event that explains why it happened |
| **Missing reactivity** | Consumers react to events automatically, eliminating the need for polling or manual checks |
| **Incomplete audit** | Events provide a complete, immutable history of every business fact |
| **Difficult debugging** | The event history allows reconstructing exactly what happened and in what order |
| **Integration complexity** | External systems can consume and produce events through a well-defined contract |

---

## 2. Event Philosophy

The Domain Event Model is built on four foundational principles.

### Events Represent Business Facts

An event is not a technical message or a log line. It is a statement that something happened that matters to the business. "The registration stage was completed" is a business fact. "A database row was updated" is not an event — it is an implementation detail. Events are expressed in the language of the domain.

### Events Are Immutable

Once an event has been recorded, it cannot be changed, retracted, or deleted. If a mistake occurs, a *new* event is recorded to correct it. This immutability ensures the event history is a trustworthy, non-repudiable record of what actually happened.

### Events Are Historical Records

Events document the past. They capture not just *what* happened, but *when*, *who*, *why*, and the *state before and after*. An event is a timestamped fact that can be used to reconstruct the state of any entity at any point in time.

### Events Trigger Workflows

Events are the primary input to the Workflow Engine. When a business fact occurs, the corresponding event is emitted, and the Workflow Engine evaluates whether the new fact requires any action — a state transition, a task creation, a notification, or an escalation. Events are the spark that keeps the workflow moving.

---

## 3. Core Concepts

| Concept | Description |
|---|---|
| **Domain Event** | A record of a business fact that has occurred. A domain event is named in past tense and carries the data necessary to describe what happened. Example: *TradeCaseCreated* |
| **Event Producer** | The source that emits the event. A producer may be the system (automated), a user (manual action), an external system (bank confirmation), or a scheduled process (timer). |
| **Event Consumer** | Any component that receives and processes an event. Consumers subscribe to specific event types and react when those events occur. A consumer may be the Workflow Engine, the Audit System, a notification service, or an external integration. |
| **Event Handler** | The specific logic that processes a particular event type. Each event type may have multiple handlers, each responsible for a different reaction (e.g., update state, send notification, create task). |
| **Event Payload** | The data carried by the event. The payload contains the facts about what happened, including identifiers, timestamps, before/after state, and contextual metadata. |
| **Event History** | The immutable, append-only log of all events that have occurred. The event history is the source of truth for what has happened in the system and can be queried for audit, debugging, and state reconstruction. |

### Event Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│ Producer │────→│ Domain Event │────→│  Event       │────→│ Consumer   │
│          │     │              │     │  Channel     │     │            │
└──────────┘     └──────────────┘     └──────────────┘     └────────────┘
                        │                                          │
                        ▼                                          ▼
                ┌──────────────┐                          ┌──────────────┐
                │  Event       │                          │  Reaction    │
                │  History     │                          │  (Handler)   │
                │  (Immutable) │                          │              │
                └──────────────┘                          └──────────────┘
```

1. A **Producer** detects that a business fact has occurred
2. A **Domain Event** is created with the relevant payload
3. The event is published to an **Event Channel**
4. The event is recorded in the **Event History** (immutable store)
5. All interested **Consumers** receive the event
6. Each consumer's **Event Handler** processes the event and produces a reaction

---

## 4. Event Categories

Domain events in PTMS are organised into nine categories. Each category represents a distinct area of business activity.

| Category | Description | Example Events |
|---|---|---|
| **Trade Case Events** | Events related to the creation, status, and overall lifecycle of a trade case | TradeCaseCreated, TradeCaseCompleted, StatusChanged, TradeCaseArchived |
| **Stage Events** | Events that track progression through individual lifecycle stages | RegistrationStarted, AllocationCompleted, OriginStarted |
| **Document Events** | Events related to documents associated with a trade case | DocumentAdded, DocumentUpdated, DocumentRemoved |
| **Approval Events** | Events in the approval workflow lifecycle | ApprovalRequested, ApprovalGranted, ApprovalRejected, ApprovalDelegated |
| **Financial Events** | Events related to financial data — allocations, declarations, commitments | AllocationAmountChanged, CommitmentSettled, BalanceRecalculated |
| **Import Events** | Events generated during the data import process | ImportStarted, ImportCompleted, ImportFailed, DataImported |
| **Deadline Events** | Time-based events generated by deadline monitoring | DeadlineApproaching, DeadlineExpired, EscalationTriggered |
| **User Action Events** | Events representing manual actions taken by human actors | CaseCancelled, CaseReopened, TaskCompleted, OverrideApplied |
| **System Events** | Events generated by automated system processes | WorkflowEvaluationTriggered, ExternalSignalReceived, RuleEvaluated |

---

## 5. Trade Case Lifecycle Events

The trade case lifecycle follows a defined sequence of stages. Each stage transition and significant milestone is represented by a domain event.

```
TradeCaseCreated
       │
       ▼
RegistrationStarted ──→ RegistrationCompleted
                                │
                                ▼
                       AllocationStarted ──→ AllocationCompleted
                                                    │
                                                    ▼
                                           OriginStarted ──→ OriginCompleted
                                                                   │
                                                                   ▼
                                                          DeclarationStarted ──→ DeclarationCompleted
                                                                                        │
                                                                                        ▼
                                                                               CommitmentStarted ──→ TradeCaseCompleted
```

### Event Descriptions

| Event | Business Meaning | Typical Trigger |
|---|---|---|
| **TradeCaseCreated** | A new trade case has been created in the system | First data received or manual creation by a user |
| **RegistrationStarted** | The registration stage has become active | Registration data is present for the trade case |
| **RegistrationCompleted** | The registration stage is fulfilled | Registration records exist with a registration number |
| **AllocationStarted** | The allocation stage has become active | Registration is complete and allocation data is present |
| **AllocationCompleted** | The allocation stage is fulfilled | Allocation records exist with approved amounts |
| **OriginStarted** | The origin stage has become active | Allocation is complete and origin data is present |
| **OriginCompleted** | The origin stage is fulfilled | Origin certificate records are registered |
| **DeclarationStarted** | The declaration stage has become active | Origin is complete and declaration data is present |
| **DeclarationCompleted** | The declaration stage is fulfilled | Customs declaration records are submitted |
| **CommitmentStarted** | The commitment stage has become active | Declaration is complete and commitment data is present |
| **TradeCaseCompleted** | All five stages are fulfilled and the trade case is complete | All five stages have data |

### Activity Status Events

In addition to stage events, the following activity status events are also defined:

| Event | Business Meaning | Typical Trigger |
|---|---|---|
| **StatusChanged** | The activity status has changed (Active, Waiting, Blocked, etc.) | Condition detected by the Workflow Engine |
| **TradeCaseWaiting** | The trade case is awaiting an external input or confirmation | External dependency detected |
| **TradeCaseBlocked** | The trade case cannot proceed due to a systemic issue | Blocking condition detected |
| **TradeCaseArchived** | The trade case has been archived after completion | Operator action |

---

## 6. Data Change Events

Data change events record modifications to the underlying business data that a trade case references. These events are typically generated when data is imported, updated, or removed.

| Event | Category | Description |
|---|---|---|
| **DocumentAdded** | Document | A new document has been associated with the trade case |
| **DocumentUpdated** | Document | An existing document's metadata or content has changed |
| **DocumentRemoved** | Document | A document has been removed from the trade case |
| **AmountChanged** | Financial | A financial amount has changed (allocation, declaration, or commitment) |
| **StatusChanged** | Trade Case | The activity status of the trade case has changed |
| **DeadlineChanged** | Deadline | A stage deadline has been recalculated or adjusted |
| **DataImported** | Import | A batch of records has been imported for a specific stage |
| **DataCorrected** | Import | Previously imported data has been corrected or amended |

### Example: Data Change Event Trigger

```
DataImported (Allocation records)
       │
       ▼
AmountChanged (Allocation total updated)
       │
       ▼
WorkflowEvaluationTriggered (Engine re-evaluates state)
       │
       ▼
StageCompleted or StatusChanged (Engine output)
```

---

## 7. Workflow Related Events

The Workflow Engine consumes domain events as its primary input and generates further events as output. This event-driven pipeline ensures that every business fact triggers the appropriate workflow processing.

```
┌──────────────────────────────────────────────────────────────────┐
│                     EVENT-DRIVEN PIPELINE                        │
│                                                                  │
│  Input Event                      Output Event(s)               │
│                                                                  │
│  DataImported ────┐                                              │
│                   │                                              │
│  StatusChanged ───┤                                              │
│                   ├──→ WorkflowEvaluationTriggered ──→ StageChanged│
│  ExternalSignal ──┤                        │                    │
│                   │                        ├──→ TaskCreated     │
│  DeadlineEvent ───┘                        │                    │
│                                            ├──→ AlertGenerated  │
│                                            │                    │
│                                            └──→ AuditRecorded   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### How Events Trigger Workflow Actions

| Input Event | Workflow Processing | Output Events |
|---|---|---|
| **DataImported** | Engine evaluates stage completion criteria | StageStarted, StageCompleted, StatusChanged |
| **StatusChanged** | Engine evaluates business rules against new status | AlertGenerated, TaskCreated |
| **ExternalSignal** | Engine validates signal and determines transition | ApprovalGranted, StageCompleted |
| **DeadlineApproaching** | Engine checks deadline thresholds | TaskCreated (reminder), NotificationSent |
| **DeadlineExpired** | Engine triggers escalation logic | TaskEscalated, AlertGenerated |
| **ApprovalRequested** | Engine routes to approval chain | ApprovalDelegated, NotificationSent |
| **ApprovalGranted** | Engine completes the transition | StageCompleted, StatusChanged |

---

## 8. Event Actors

Events are produced by four categories of actors. Each actor type leaves a distinct signature in the event payload.

| Actor | Description | Produces Events |
|---|---|---|
| **System** | The PTMS itself. Automated processes that run without human intervention. | WorkflowEvaluationTriggered, DeadlineApproaching, AlertGenerated, StageCompleted |
| **User** | A human actor interacting with the system. Different user roles produce events from their respective domains (Trade Manager, Commercial Employee, Finance User, Management). | TradeCaseCreated, CaseCancelled, ApprovalGranted, TaskCompleted, OverrideApplied |
| **External System** | Systems outside PTMS that send signals or confirmations. Includes banks, customs authorities, and other integrated platforms. | ExternalConfirmationReceived, ExternalSignalReceived, ExternalDataPushed |
| **Scheduled Process** | Time-driven processes that run on a schedule or at specific intervals. | DeadlineCheckExecuted, PeriodicEvaluationTriggered, EscalationReviewPerformed |

Each event records its actor so that the event history always answers the question "who caused this to happen?"

---

## 9. Event Payload Concept

Every domain event carries a standard set of information that describes the business fact. The payload is structured to be self-contained and meaningful without requiring additional context.

### Standard Payload Fields

| Field | Description | Required |
|---|---|---|
| **Event ID** | A unique identifier for this specific event instance | Always |
| **Event Type** | The type/name of the event (e.g., TradeCaseCreated, StageCompleted) | Always |
| **Timestamp** | The date and time (UTC) when the event occurred | Always |
| **Actor** | Who or what produced the event (System, User ID, External System, Scheduled Process) | Always |
| **Entity Reference** | The identifier of the entity the event relates to (e.g., trade case ID, document ID, approval request ID) | Always |
| **Entity Type** | The type of entity (e.g., TradeCase, Document, ApprovalRequest) | Always |
| **Previous State** | The state of the entity before the event occurred | If applicable |
| **New State** | The state of the entity after the event occurred | If applicable |
| **Reason** | A human-readable description of why the event occurred | Always |
| **Context** | Additional metadata relevant to the event (e.g., rule results, external reference numbers, user notes) | If applicable |

### Example Payload: StageCompleted

| Field | Value |
|---|---|
| Event ID | evt-2026-07-20-a1b2c3d4 |
| Event Type | AllocationCompleted |
| Timestamp | 2026-07-20T14:30:00Z |
| Actor | System (Workflow Engine) |
| Entity Reference | TC-2026-0042 |
| Entity Type | TradeCase |
| Previous State | Allocation (started, incomplete) |
| New State | Allocation (completed) |
| Reason | All allocation records have been imported and approved |
| Context | { "totalAllocated": 500000, "recordsImported": 3, "approvalReference": "APP-2026-0081" } |

---

## 10. Event Processing Rules

Events must be processed in a reliable and predictable manner. The following rules govern event handling.

### Ordering

- Events for the **same entity** (e.g., a specific trade case) must be processed in the order they occurred
- Events for **different entities** are independent and may be processed in any order
- Each event carries a timestamp and a sequence indicator to support ordering

### Duplication Handling

- The system must detect and ignore duplicate events
- Duplicate detection is based on the Event ID — the same Event ID must never be processed twice
- If a duplicate event is received, it is acknowledged but not processed (idempotent consumption)

### Validation

Every event must pass validation before it is processed:

| Validation | Rule |
|---|---|
| **Schema** | The event payload must contain all required fields with valid values |
| **Reference** | The entity referenced by the event must exist |
| **Transition** | For state change events, the transition from previous to new state must be valid |
| **Actor** | The actor must have the authority to produce the event |

If validation fails, the event is recorded in the event history as "failed" with the validation error details.

### Failure Handling

- **Transient failure**: If a consumer fails temporarily (e.g., network timeout), the event is retried a configurable number of times before escalation
- **Persistent failure**: If a consumer repeatedly fails to process an event, the event is recorded as "failed" and an alert is generated for operator review
- **Producer failure**: If an event cannot be published due to a producer failure, the producer must retry until successful or escalate

### Retry Concept

```
Event Published
       │
       ▼
┌──────────────────┐
│  Consumer        │
│  Processing      │────→ Success → Event marked as "processed"
└──────────────────┘
       │ Failure
       ▼
┌──────────────────┐
│  Retry (up to 3) │────→ Success
└──────────────────┘
       │ Persistent failure
       ▼
┌──────────────────┐
│  Escalate        │────→ Alert generated for operator
└──────────────────┘
```

---

## 11. Event History and Audit

The event history is the permanent, immutable record of every domain event that has occurred in PTMS.

### Immutable History

- Events are append-only. Once recorded, an event cannot be modified or deleted
- The event history grows monotonically — new events are added, but existing events never change
- Any correction to a prior event must be recorded as a new event (e.g., a correction event that references the original)

### Traceability

The event history enables full traceability of every business fact:

- **Forward trace**: Starting from any event, what happened next?
- **Backward trace**: Starting from the current state, what sequence of events led here?
- **Impact analysis**: If a particular type of event occurred, which trade cases were affected?
- **Root cause analysis**: When a problem occurred, what events preceded it?

### Compliance Requirements

| Requirement | Implementation |
|---|---|
| **Retention** | Events must be retained for the full regulatory retention period (no deletion) |
| **Queryability** | Events must be queryable by trade case, actor, event type, date range, and entity reference |
| **Non-repudiation** | The event history must prove that an event occurred and cannot be disputed |
| **Export** | The event history for a trade case must be exportable for regulatory reporting |
| **Integrity** | The event history must be protected against tampering (immutable storage) |

---

## 12. Relationship With

The Domain Event Model connects and enables several other architecture components.

### Lifecycle

The **Lifecycle** defines *what* stages exist and *when* they are considered complete. The Domain Event Model records *that* a stage transition occurred. Lifecycle definitions provide the rules; events provide the record of execution. Every lifecycle transition defined in the Lifecycle architecture generates a corresponding domain event.

### Workflow Engine

The **Workflow Engine** is the primary consumer of domain events. Events trigger the engine to evaluate state, execute rules, and determine required actions. The engine also produces events as output (state changes, task creations, alerts). The relationship is circular:

```
Event → Workflow Engine → Event(s)
```

The engine never polls or runs on a fixed schedule — it only reacts to events.

### State Engine

The **State Engine** produces state snapshots. These snapshots can be reconstructed from the event history by replaying all events for a given trade case in order. While the State Engine provides the current state for performance, the event history provides the authoritative record of how that state was reached.

### Business Rules

**Business Rules** are evaluated by the Workflow Engine when triggered by events. The Domain Event Model does not contain rules, but events carry the data that rules evaluate. When a rule evaluation produces a result, that result may be recorded as a new event (e.g., AlertGenerated, TaskCreated).

### Audit System

The **Audit System** is built directly on the Domain Event Model. Every domain event is an audit record. The immutability, traceability, and completeness of the event history are the foundation of the audit system's compliance capabilities. Separate audit records are not needed — the event history *is* the audit trail.

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Lifecycle   │     │  Workflow        │     │  State Engine   │
│  (defines    │────→│  Engine          │────→│  (snapshots)    │
│   stages)    │     │  (consumes/produces)   │                 │
└──────────────┘     └────────┬─────────┘     └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Domain Event    │
                    │  Model           │
                    │                  │
                    │  ┌────────────┐  │
                    │  │  Event     │  │
                    │  │  History   │  │
                    │  └────────────┘  │
                    └────────┬─────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────┐           ┌────────────────┐
        │  Business    │           │  Audit         │
        │  Rules       │           │  System        │
        │  (evaluate)  │           │  (compliance)  │
        └──────────────┘           └────────────────┘
```

---

## 13. Event Naming Convention

Domain events follow a consistent naming convention to ensure clarity and predictability.

### Naming Principles

1. **Past tense** — Events describe something that has already happened. Use past tense verbs:
   - ✓ *TradeCaseCreated*, *AllocationCompleted*, *DocumentAdded*
   - ✗ *CreateTradeCase*, *CompleteAllocation*, *AddDocument*

2. **Business meaning** — Names reflect business facts, not technical operations:
   - ✓ *TradeCaseCompleted* (business fact)
   - ✗ *DataSaveSucceeded* (technical operation)

3. **Clear ownership** — The entity that the event relates to should be clear from the name:
   - ✓ *RegistrationStarted* (entity: Registration stage)
   - ✓ *TradeCaseBlocked* (entity: Trade Case)

### Naming Pattern

```
[Entity][Past Tense Action]
```

| Component | Examples |
|---|---|
| **Entity** | TradeCase, Registration, Allocation, Origin, Declaration, Commitment, Document, Approval, Task, Import, Deadline |
| **Past Tense Action** | Created, Started, Completed, Changed, Added, Updated, Removed, Granted, Rejected, Deleted, Expired, Escalated |

### Examples

| Correct Name | Incorrect Name | Reason |
|---|---|---|
| TradeCaseCreated | CreateTradeCase | Past tense required |
| StageCompleted | StageFinished | "Completed" is the established business term |
| AmountChanged | AmountUpdated | "Changed" captures before/after semantics better |
| ApprovalGranted | ApproveRequest | Past tense and business fact semantics |
| DataImported | ImportSucceeded | "DataImported" describes the business fact, not the technical outcome |

---

## 14. Future Extensions

The Domain Event Model is designed to accommodate future growth without requiring fundamental changes to the event infrastructure.

### Event Streaming

Real-time event streams may be introduced to:
- Power live dashboards showing trade case activity as it happens
- Enable monitoring and alerting on event patterns (e.g., rapid status changes, escalation chains)
- Provide event feeds for analytics and reporting systems

### External Integrations

Events may need to be published to external systems:
- **Webhooks**: External systems subscribe to specific event types and receive events in real time
- **Message queues**: Events are published to message brokers for consumption by enterprise integration platforms
- **API feeds**: External partners pull event data via API for their own processing

### AI Event Analysis

Machine learning models may analyse the event stream to:
- Detect patterns that precede delays or failures
- Predict trade case outcomes based on event sequences
- Recommend optimal actions based on historical event patterns
- Identify anomalies in event frequency or ordering

### Real-Time Monitoring

An event monitoring layer may provide:
- **Throughput metrics**: How many events per category per hour?
- **Bottleneck detection**: Which stages generate the most events? Where do events stall?
- **SLA monitoring**: Are events being processed within expected timeframes?
- **Alerting**: Unusual event patterns trigger operational alerts

---

## Appendix A: Event Category Summary

| # | Category | Event Count | Example Events |
|---|---|---|---|
| 1 | Trade Case Events | 6 | TradeCaseCreated, TradeCaseCompleted, StatusChanged, TradeCaseWaiting, TradeCaseBlocked, TradeCaseArchived |
| 2 | Stage Events | 10 | RegistrationStarted, RegistrationCompleted, AllocationStarted, AllocationCompleted, OriginStarted, OriginCompleted, DeclarationStarted, DeclarationCompleted, CommitmentStarted, TradeCaseCompleted |
| 3 | Document Events | 3 | DocumentAdded, DocumentUpdated, DocumentRemoved |
| 4 | Approval Events | 5 | ApprovalRequested, ApprovalGranted, ApprovalRejected, ApprovalDelegated, ApprovalChainCompleted |
| 5 | Financial Events | 4 | AllocationAmountChanged, DeclarationAmountChanged, CommitmentSettled, BalanceRecalculated |
| 6 | Import Events | 4 | ImportStarted, ImportCompleted, ImportFailed, DataImported |
| 7 | Deadline Events | 4 | DeadlineApproaching, DeadlineExpired, EscalationTriggered, DeadlineRecalculated |
| 8 | User Action Events | 6 | CaseCancelled, CaseReopened, TaskCompleted, OverrideApplied, ManualAssignmentMade, TaskDeferred |
| 9 | System Events | 5 | WorkflowEvaluationTriggered, ExternalSignalReceived, RuleEvaluated, AlertGenerated, PeriodicCheckExecuted |

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **Domain Event** | A record of a business fact that has occurred, expressed in past tense |
| **Event Producer** | The source that detects and publishes a domain event |
| **Event Consumer** | A component that subscribes to and processes domain events |
| **Event Handler** | The logic within a consumer that processes a specific event type |
| **Event Payload** | The structured data carried by an event describing what happened |
| **Event History** | The immutable, append-only log of all domain events |
| **Event Channel** | The mechanism by which events are distributed from producers to consumers |
| **Idempotency** | The ability to process the same event multiple times without producing duplicate effects |
| **Event Sourcing** | The practice of using the event history as the authoritative source for reconstructing state |

---

## Appendix C: Document References

| Document | Reference |
|---|---|
| Trade Case Lifecycle Architecture | Defines the lifecycle stages and transitions that generate domain events |
| Workflow Engine Architecture | Consumes domain events as primary input and produces events as output |
| Current Architecture | Provides the overall system context for event producer and consumer placement |