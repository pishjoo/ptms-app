# PTMS Project State

**Last Updated:** 2026-07-14  
**Baseline:** v0.1  
**Build Status:** ✅ Clean (zero errors)  

---

## 1. Project Overview

| Attribute | Value |
|---|---|
| **Project Name** | PTMS (Process Trade Monitoring System) |
| **Repository** | github.com/pishjoo/ptms-app |
| **Latest Commit** | `04f61cb932904cd3a017c40609170c64a2fe97a3` |
| **Current Sprint** | 12 |
| **Next Sprint** | 13 |
| **Active Branch** | `main` |
| **Package Version** | `ptms-app@1.0.0` |

---

## 2. Layer Completion Status

| Layer | Status | Completion % | Notes |
|---|---|---|---|
| **Presentation** | 🟡 Partial | 40% | Dashboard, trade-cases, ntsw, settings pages exist but are stubs |
| **UI Components** | 🟡 Partial | 20% | Only app-shell, summary-card, alert-panel, progress-panel, recent-activity-panel exist |
| **Application Services** | 🟢 Complete | 100% | 5 services: Orchestrator, Preview, Analysis, Query, Builder |
| **Domain Model** | 🟡 Partial | 60% | Aggregates done, state engine done, rules are stubs, duplication exists |
| **Import Pipeline** | 🟢 Complete | 100% | Detection, mapping, change detection, merge engine all implemented |
| **Database Schema** | 🟡 Partial | 30% | Prisma schema exists but not in active use by server code |
| **Authentication** | 🔴 Missing | 0% | No auth middleware, no login page, no role management |
| **Testing** | 🔴 Missing | 0% | No test files anywhere in the repository |
| **Mock Layer** | 🟡 Partial | 30% | Single mock provider exists |

---

## 3. Domain Completion by Subdomain

| Subdomain | Status | Details |
|---|---|---|
| Trade Case Entity | ✅ Complete | TradeCaseAggregate defined with all fields |
| Registration | ✅ Complete | DTO, mapper, detection |
| Allocation | ✅ Complete | DTO, mapper, detection |
| Origin | ✅ Complete | DTO, mapper, detection |
| Declaration | ✅ Complete | DTO, mapper, detection |
| Commitment | ✅ Complete | DTO, mapper, detection |
| State Engine | ✅ Complete | 6 files covering stage/health/progress/action/deadlines |
| Rules Engine | 🟡 Stubs | 6 rule interfaces implemented, all return `{ passed: true }` |
| Business Services | 🟡 Duplicate | Overlaps with state engine — needs consolidation |
| Alerts | 🟡 Partial | TradeCaseAlert type exists, but no real alert generation |
| Notifications | 🔴 Missing | Not yet implemented |
| Audit Log | 🔴 Missing | Not yet implemented |
| Timeline | 🔴 Missing | Not yet implemented |

---

## 4. File Inventory

### Source Files by Extension
| Extension | Count |
|---|---|
| `.ts` | 55 |
| `.tsx` | 8 |
| `.css` | 1 |
| `.json` | 4 |
| `.js` | 3 |
| `.md` | 4 (including this one) |
| **Total** | **~75** |

### Key Directories
| Directory | Files | Description |
|---|---|---|
| `server/application/` | 8 | Application services + preview models |
| `server/domain/trade-case/` | 22 | Domain entities, rules, calculators, state, services |
| `server/import/` | 20 | Import pipeline (detection → mapping → sync) |
| `server/mock/` | 1 | Mock data provider |
| `app/` | 6 | Next.js pages |
| `components/` | 5 | React components |
| `prisma/` | 1 | Database schema |
| `docs/` | 4 | Documentation (blueprint + baseline docs) |
| `lib/` | 1 | Utility functions |

---

## 5. Dependency Summary

| Dependency | Version | Purpose |
|---|---|---|
| `next` | 14.2.35 | Framework |
| `react` | ^18 | UI library |
| `typescript` | ^5 | Language |
| `tailwindcss` | ^3 | CSS framework |
| `prisma` | (latest) | Database ORM |
| `xlsx` | (latest) | Excel file parsing |
| `shadcn/ui` | (components) | UI component library |
| `clsx` | (latest) | CSS class utilities |
| `tailwind-merge` | (latest) | Tailwind class conflict resolution |

---

## 6. Known Issues

### Immediate (Blocking)
1. **No tests** — any refactoring or feature addition is high-risk
2. **No authentication** — the platform has zero access control
3. **Rules engine is non-functional** — all 6 rules are stubs

### Short-Term (Should Fix Before Sprint 14)
4. Duplicate domain logic in `business/` and `state/` packages
5. `TradeImportOrchestrator` is too large, mixes Excel manipulation with orchestration
6. Type-unsafe `(sheet as any)['!rows']` pattern
7. No input validation at any API boundary

### Long-Term (Technical Debt)
8. No pagination or streaming for large imports
9. `TradeCaseBalanceService` is a no-op passthrough
10. `normalizeKey()` creates brittle worksheet name coupling
11. No repository interfaces — database access is ad-hoc

---

## 7. Build Health

| Check | Status |
|---|---|
| TypeScript Compilation | ✅ Clean |
| Next.js Build | ✅ Clean |
| Linting | ✅ Clean |
| Tests | ⚠️ None configured |
| CI/CD | 🔴 Not configured |

---

## 8. Next Planned Milestones

| Sprint | Focus | Status |
|---|---|---|
| Sprint 11 | Import Preview Engine | ✅ Complete |
| Sprint 12 | Trade Case State Engine | ✅ Complete |
| Sprint 12 | Baseline v0.1 Freeze | ⬅️ Current |
| Sprint 13 | TBD | 🔲 Planned |

---

## 9. Environment

- **Dev Environment:** Codespaces (Linux 6.8)
- **Node.js:** Latest LTS
- **Package Manager:** npm
- **Database:** PostgreSQL (via Prisma)
- **Version Control:** Git (GitHub)