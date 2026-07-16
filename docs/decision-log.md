# PTMS Decision Log

**Last Updated:** 2026-07-14  
**Baseline:** v0.1  

---

## Decision Log Format

Each entry records:
- **Date** — When the decision was made
- **Context** — The problem or situation that prompted the decision
- **Decision** — What was chosen and why
- **Consequences** — Known tradeoffs, risks, or follow-up tasks
- **Status** — Approved / Superseded / Reverted

---

## D-001: Use Next.js App Router

| Field | Value |
|---|---|
| **Date** | 2026-06-01 (approx, pre-baseline) |
| **Context** | Need a full-stack framework with SSR, API routes, and TypeScript support for a monitoring-focused web application. |
| **Decision** | Use Next.js 14 with App Router, server components for read-heavy pages, client components for interactive views. |
| **Consequences** | (+) Unified frontend and backend in one repo. (+) App Router enables nested layouts and streaming. (-) Locks deployment to Node.js/Next.js ecosystem. (-) Server/client component boundaries add complexity. |
| **Status** | ✅ Approved |

---

## D-002: Layered Architecture with Domain-Layer Independence

| Field | Value |
|---|---|
| **Date** | 2026-06-01 (approx) |
| **Context** | Need to ensure business logic is maintainable, testable, and independent of framework or database. |
| **Decision** | Adopt Clean Architecture layering: Presentation → Application → Domain. Domain layer must have zero external dependencies. Infrastructure (Prisma) is accessed only via application services. |
| **Consequences** | (+) Domain is purely TypeScript, no framework coupling. (+) Domain can be tested without database. (+) Clear dependency direction. (-) Extra boilerplate for mapping between Prisma and domain types. (-) Some repository abstractions not yet fully implemented (raw queries used in places). |
| **Status** | ✅ Approved |

---

## D-003: Constructor-Based Dependency Injection

| Field | Value |
|---|---|
| **Date** | 2026-06-01 (approx) |
| **Context** | Need a DI strategy that is simple, framework-agnostic, and testable. |
| **Decision** | Use manual constructor-based DI without a DI container. Dependencies are passed explicitly in constructors with default parameters. |
| **Consequences** | (+) Zero framework dependency for DI. (+) Easy to understand and debug. (+) Trivially testable — pass mocks in tests. (-) More boilerplate code. (-) No automatic lifecycle management or scoping. |
| **Status** | ✅ Approved |

---

## D-004: Import Pipeline as Self-Contained Layer

| Field | Value |
|---|---|
| **Date** | 2026-06-15 (approx) |
| **Context** | Need to process Excel imports with detection, mapping, validation, and change tracking. |
| **Decision** | Implement import pipeline as a self-contained `server/import/` layer with sub-packages: detection, dto, excel, mapping, sync. |
| **Consequences** | (+) Clear stage separation. (+) DTOs are reusable across pipeline and application layers. (+) ChangeDetector is generic and reusable for any record type. (-) TradeImportOrchestrator (in application layer) ended up with too much pipeline logic — DRY violation. |
| **Status** | ✅ Approved (with noted refactoring need) |

---

## D-005: Trade Case as Central Aggregate Root

| Field | Value |
|---|---|
| **Date** | 2026-06-10 (approx) |
| **Context** | The domain revolves around import/export processes. Need a central entity that all other entities attach to. |
| **Decision** | Model TradeCase as the single aggregate root. All operational data (Registration, Allocation, Origin, Declaration, Commitment) is subordinate to TradeCase. |
| **Consequences** | (+) Clear ownership and lifecycle. (+) Simple data model with predictable loading patterns. (+) Ubiquitous language aligns with business domain. (-) Large aggregate — potential performance issues if all sub-entities are loaded eagerly. |
| **Status** | ✅ Approved |

---

## D-006: Immutable Interfaces with `readonly`

| Field | Value |
|---|---|
| **Date** | 2026-06-10 (approx) |
| **Context** | Need to enforce immutability at the type level to prevent accidental mutation of domain objects. |
| **Decision** | All interfaces use `readonly` modifiers on properties and arrays. Objects are frozen at construction boundaries. |
| **Consequences** | (+) Compile-time immutability enforcement. (+) Prevents accidental state corruption. (-) Additional verbosity. (-) Object.freeze has runtime cost. (-) spread operators create GC pressure for large collections. |
| **Status** | ✅ Approved |

---

## D-007: Five-Stage Lifecycle (Registration → Allocation → Origin → Declaration → Commitment)

| Field | Value |
|---|---|
| **Date** | 2026-06-15 (approx) |
| **Context** | Need to model the operational lifecycle of a trade case with clear stage progression. |
| **Decision** | Define exactly five stages: REGISTRATION, ALLOCATION, ORIGIN, DECLARATION, COMMITMENT. Plus COMPLETED terminal stage. |
| **Consequences** | (+) Clear, bounded domain model. (+) Stage progression is linear and easy to compute. (+) Matches import pipeline sheet types 1:1. (-) No support for custom or additional stages without modifying core types. (-) Cannot model parallel or skipped stages. |
| **Status** | ✅ Approved |

---

## D-008: Separate State Engine from Legacy Business Services

| Field | Value |
|---|---|
| **Date** | 2026-07-14 |
| **Context** | New state engine (Sprint 12) introduces stage/health/progress/action/deadlines types. The existing `business/` package has partially overlapping types. |
| **Decision** | Create `state/` package as the new canonical source for state evaluation. Keep `business/` for backward compatibility. Consolidation is planned but deferred. |
| **Consequences** | (+) New code uses clean, consistent types. (+) Backward compatibility maintained. (-) Duplicate types and logic in `business/` and `state/`. (-) Risk of diverging implementations. (-) Developer confusion about which package to use. |
| **Status** | ✅ Approved (with condition to consolidate before Sprint 14) |

---

## D-009: Keep Prisma Separate from Domain

| Field | Value |
|---|---|
| **Date** | 2026-06-01 (approx) |
| **Context** | Database access is needed but must not pollute the domain layer. |
| **Decision** | Prisma schema is maintained in `prisma/`. Application services (TradeCaseQueryService) handle the mapping from Prisma types to domain aggregates. Domain never imports Prisma. |
| **Consequences** | (+) Domain is database-agnostic. (+) Schema changes don't affect domain logic. (-) Manual mapping code required between Prisma and domain types. (-) No Prisma types available in domain for type safety. |
| **Status** | ✅ Approved |

---

## D-010: No API Routes – Direct Service Calls

| Field | Value |
|---|---|
| **Date** | 2026-06-01 (approx) |
| **Context** | Early-stage architecture decision on how to expose backend functionality to the frontend. |
| **Decision** | Use direct service instantiation and calls from Next.js server components and server actions rather than dedicated REST API routes. |
| **Consequences** | (+) Simpler code path, no HTTP overhead for internal calls. (+) TypeScript types shared directly. (-) Couples frontend to backend instantiation details. (-) No REST API surface for external clients. (-) Cannot easily swap frontend framework. |
| **Status** | ✅ Approved (MVP phase) |

---

## D-011: TypeScript Strict Mode

| Field | Value |
|---|---|
| **Date** | 2026-06-01 (approx) |
| **Context** | Need to maximize type safety and catch errors at compile time. |
| **Decision** | Enable `strict: true` in tsconfig.json. |
| **Consequences** | (+) Maximum type safety. (+) Better IDE support and autocompletion. (-) More verbose type annotations required. (-) Some patterns (e.g., `as any` casts, `as TValue` casts) work around strictness. |
| **Status** | ✅ Approved |

---

## D-012: No Test Suite Yet (Deferred)

| Field | Value |
|---|---|
| **Date** | 2026-06-01 (approx, implicit) |
| **Context** | Early sprints focused on building core functionality. Tests were deferred. |
| **Decision** | No testing framework configured. Zero test coverage. |
| **Consequences** | (-) All refactoring is high-risk. (-) Bug detection relies entirely on manual testing. (-) Cannot run automated CI/CD quality gates. (-) This is the highest-priority architectural debt. |
| **Status** | ⚠️ Acknowledged — must be addressed before Sprint 14 |

---

## Decision Summary

| # | Decision | Status | Priority |
|---|---|---|---|
| D-001 | Next.js App Router | ✅ Approved | — |
| D-002 | Layered Clean Architecture | ✅ Approved | — |
| D-003 | Constructor-based DI | ✅ Approved | — |
| D-004 | Self-contained Import Pipeline | ✅ Approved | Refactor noted |
| D-005 | TradeCase as Aggregate Root | ✅ Approved | — |
| D-006 | Immutable readonly interfaces | ✅ Approved | — |
| D-007 | Five-stage lifecycle | ✅ Approved | — |
| D-008 | New state/ package alongside business/ | ✅ Approved | Consolidate before Sprint 14 |
| D-009 | Prisma separate from domain | ✅ Approved | — |
| D-010 | Direct service calls (no REST API) | ✅ Approved | — |
| D-011 | TypeScript strict mode | ✅ Approved | — |
| D-012 | No test suite (deferred) | ⚠️ Debt | Address before Sprint 14 |

---

*New decisions require entry in this log before implementation.*