# PTMS Current Architecture

**Last Updated:** 2026-07-14  
**Baseline:** v0.1  

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                         │
│  app/ (Next.js App Router)  │  components/ (React/UI)       │
│  pages: dashboard, trade-cases, ntsw, settings              │
├─────────────────────────────────────────────────────────────┤
│                   Application Layer                          │
│  server/application/                                         │
│  ├── TradeImportOrchestrator  (import pipeline entry point)  │
│  ├── ImportPreviewService     (preview grouping + state)     │
│  ├── TradeCaseAnalysisService (analysis orchestration)       │
│  ├── TradeCaseQueryService    (Prisma → aggregate mapping)   │
│  ├── TradeCaseBuilder         (aggregate construction)       │
│  └── import-preview/          (preview model types)          │
├─────────────────────────────────────────────────────────────┤
│                   Domain Layer                                │
│  server/domain/trade-case/                                    │
│  ├── entities/         TradeCaseAggregate                    │
│  ├── business/         Balance, Health, Progress, Status     │
│  ├── state/            Stage, Health, Progress, Action,      │
│  │                     Deadlines, StateEngine                │
│  ├── rules/            6 rule interfaces + stub impls        │
│  ├── calculators/      Progress calc, Risk calc             │
│  ├── services/         TradeCaseAnalyzer                     │
│  ├── alerts/           Alert types                           │
│  └── dto/              TradeCaseSummary DTO                  │
├─────────────────────────────────────────────────────────────┤
│                   Import Pipeline                             │
│  server/import/                                              │
│  ├── detection/        FileDetector, ProfileRegistry         │
│  ├── dto/              Import DTOs (5 domains + context)     │
│  ├── excel/            ExcelReader, WorkbookValidator,       │
│  │                     WorksheetLoader                       │
│  ├── mapping/          Mappers (registration, allocation,    │
│  │                     origin, declaration, commitment)      │
│  └── sync/             ChangeDetector, MergeEngine,          │
│                        ChangeSet, ChangeType                 │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure                              │
│  prisma/schema.prisma                                        │
│  lib/utils.ts                                                │
├─────────────────────────────────────────────────────────────┤
│                   Mock Layer                                  │
│  server/mock/mock-trade-case-provider.ts                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Module Dependency Graph

```
Presentation ──→ Application ──→ Domain
                                      │
                            Import Pipeline (self-contained)
                                      │
                                      ▼
                                 Infrastructure (Prisma)
```

- **Domain** has zero dependencies (no framework, no Prisma, no Next.js)
- **Application** depends on Domain and Import Pipeline
- **Import Pipeline** depends only on its own types (DTOs)
- **Mock** can replace any layer for testing

---

## 3. Key Interfaces

### Aggregate Root
```typescript
interface TradeCaseAggregate {
  id: string;
  registrationNumber: string | null;
  companyName: string;
  status: string;
  lastActivityAt: Date | null;
  assignedUser: string | null;
  approvedAllocation: number;
  remainingAllocation: number;
  registeredOrigin: number;
  remainingOrigin: number;
  declaredAmount: number;
  remainingDeclaration: number;
  commitmentCleared: number;
  remainingCommitment: number;
  registration?: RegistrationImportDto | null;
  allocations?: readonly AllocationImportDto[];
  origins?: readonly OriginImportDto[];
  declarations?: readonly DeclarationImportDto[];
  commitments?: readonly CommitmentImportDto[];
}
```

### Change Detection
```typescript
interface ChangeSet<TRecord> {
  addedRecords: Array<{ record: TRecord; changeType: ChangeType }>;
  updatedRecords: Array<{ record: TRecord; previousRecord: TRecord; changedFields: string[]; changeType: ChangeType }>;
  removedRecords: Array<{ record: TRecord; changeType: ChangeType }>;
  unchangedRecords: Array<{ record: TRecord; changeType: ChangeType }>;
}
```

### State Engine Result
```typescript
interface TradeCaseStateEngineResult {
  stage: { current: TradeCaseStage; next: TradeCaseStage; completed: boolean };
  health: TradeCaseHealth;
  progress: TradeCaseProgress;
  nextAction: NextAction;
  deadlines: DeadlineCollection;
}
```

### Import Preview (UI-ready)
```typescript
interface ImportPreview {
  summary: PreviewSummary;
  tradeCases: Record<string, TradeCasePreview>;
  unassignedWarnings: readonly PreviewWarning[];
  unassignedErrors: readonly PreviewError[];
  detectedFileType: string;
  totalRowsProcessed: number;
}
```

---

## 4. Data Flow

### Import Flow
```
Excel File
  → ExcelReader.readWorkbook()
  → FileDetector.detect()           → profile (REGISTRATION_ORDER, etc.)
  → WorksheetLoader.loadWorksheets() → logical name mapping
  → WorkbookValidator.validate()     → warnings/errors
  → Mapper.mapWorksheet()            → typed DTOs
  → ChangeDetector.detectChanges()   → ChangeSet (added/updated/removed/unchanged)
  → TradeImportOrchestrator returns raw ImportPreview
  → ImportPreviewService.buildPreview()
    → groupByTradeCase()             → grouped by registration number
    → assignWarningsAndErrors()      → per-trade-case warnings/errors
    → TradeCaseStateEngine.evaluate() → state for each trade case
    → computeSummary()               → aggregate statistics
  → returns UI-ready ImportPreview
```

### Analysis Flow
```
TradeCaseQueryService.getTradeCaseAggregate()
  → Prisma findUnique → domain aggregate
  → TradeCaseAnalysisService.analyze()
    → TradeCaseAnalyzer.analyze()
      → RuleRegistry rules evaluate
      → Calculators compute progress/risk
    → Returns summary + alerts
```

---

## 5. File Count by Layer

| Layer | Files | Lines (approx) |
|---|---|---|
| `app/` | 6 | ~120 |
| `components/` | 5 | ~200 |
| `server/application/` | 8 | ~750 |
| `server/domain/` | 22 | ~900 |
| `server/import/` | 20 | ~1,100 |
| `server/mock/` | 1 | ~30 |
| `prisma/` | 1 | ~200 |
| `lib/` | 1 | ~10 |
| `docs/` | 1 (pre-existing) | ~300 |
| **Total** | **~65** | **~3,600** |

---

## 6. Configuration & Build

- **Framework:** Next.js 14.2.35
- **Language:** TypeScript 5.x (strict mode)
- **Styling:** Tailwind CSS 3.x
- **UI Library:** shadcn/ui (Card component)
- **Database ORM:** Prisma
- **Build:** `next build` (TypeScript compilation + Next.js production build)
- **Module Resolution:** `bundler` strategy with `@/` path alias