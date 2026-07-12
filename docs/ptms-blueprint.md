# PTMS Architecture Blueprint

## 1. Product Vision

PTMS is not a generic ERP platform. It is a foreign trade process monitoring platform focused on operational visibility, workflow control, and regulatory tracking for import/export activities.

The central business entity is the Trade Case. Every operational activity in the system is organized around a trade case and its lifecycle.

### Core goals
- Monitor import/export processes from initiation to completion
- Centralize trade-case status, documents, deadlines, and progress
- Support monitoring of Iran NTSW (National Trade System) events and updates
- Improve collaboration across commercial, operational, and financial teams
- Provide clear process timelines and auditability without introducing unnecessary ERP complexity

---

## 2. Target Users

- Company Admin
- Foreign Trade Manager
- Commercial Employee
- Accountant
- Viewer

### Role expectations
- Admin: manage users, companies, and platform settings
- Foreign Trade Manager: oversee trade cases, process status, and escalations
- Commercial Employee: create and update trade-case information and related records
- Accountant: monitor financial-related status points such as currency requests and approvals
- Viewer: access dashboards, timelines, and read-only records

---

## 3. Core Modules

The MVP focuses on monitoring-driven trade operations rather than broad enterprise resource planning.

1. Authentication and user management
2. Company management
3. Trade case management
4. Iran NTSW monitoring
5. Registration Order
6. Currency Request
7. Bank Approval Status
8. Customs Declaration
9. Shipment Tracking
10. Document Checklist
11. Process Timeline
12. Notifications
13. Audit logs

---

## 4. Recommended Technical Architecture

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Server components for read-heavy pages
- Client components for forms, filters, and interactive monitoring views

### Backend
- Next.js server actions and API routes
- Domain-focused services for trade operations
- Centralized validation, error handling, and authorization
- Event-driven notifications for workflow updates

### Database
- PostgreSQL
- Prisma ORM
- Migration-based schema evolution

### Infrastructure and tooling
- Environment-based configuration
- Prisma Studio for local inspection
- Docker for local development readiness
- GitHub Actions for CI/CD later

---

## 5. Proposed Folder Structure

```text
ptms-app/
  app/
    (auth)/
      login/
      register/
    (dashboard)/
      page.tsx
      analytics/
    companies/
    trade-cases/
    ntsw/
    registration-orders/
    currency-requests/
    bank-approvals/
    customs-declarations/
    shipments/
    documents/
    timelines/
    notifications/
    audit-logs/
    settings/
    api/
      auth/
      companies/
      trade-cases/
      ntsw/
      registration-orders/
      currency-requests/
      bank-approvals/
      customs-declarations/
      shipments/
      documents/
      timelines/
      notifications/
      audit-logs/

  components/
    ui/
    layout/
    forms/
    tables/
    modules/
    charts/

  features/
    auth/
    companies/
    trade-cases/
    ntsw/
    registration-orders/
    currency-requests/
    bank-approvals/
    customs-declarations/
    shipments/
    documents/
    timelines/
    notifications/
    audit-logs/

  lib/
    auth/
    constants/
    utils/
    validators/
    helpers/
    hooks/

  prisma/
    schema.prisma
    migrations/
    seed.ts

  server/
    actions/
    services/
    repositories/
    middleware/

  types/
    api/
    domain/
    ui/

  public/
    images/
    icons/

  docs/
    architecture/
    api/

  tests/
    unit/
    integration/
    e2e/

  .env.example
  docker-compose.yml
  Dockerfile
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
```

---

## 6. Database Entity List

### Core identity and access
- User
- Role
- Permission
- Session
- Company
- CompanyUser

### Trade-case centric domain
- TradeCase
- TradeCaseStatusHistory
- TradeCaseParticipant
- TradeCaseComment
- TradeCaseTag

### Trade process domains
- RegistrationOrder
- CurrencyRequest
- BankApprovalStatus
- CustomsDeclaration
- ShipmentTracking
- DocumentChecklist
- ProcessTimeline

### NTSW monitoring
- NTSWMonitor
- NTSWStatusUpdate
- NTSWAlert

### Document and communication
- Document
- DocumentCategory
- Notification
- NotificationTemplate
- AuditLog

### Supporting reference data
- Country
- Port
- Commodity
- Currency
- Incoterm
- UnitOfMeasure

---

## 7. Entity Relationships Overview

### Trade case as the core entity
- Every import/export workflow is represented by one TradeCase
- Registration orders, currency requests, customs declarations, shipments, documents, and timeline events are linked to a TradeCase
- The trade case becomes the single operational anchor for monitoring and reporting

### User and company structure
- A user belongs to one or more companies
- Each company owns trade cases and related operational records
- Roles determine which actions a user can take on a trade case

### Monitoring flow
- NTSW updates are attached to the relevant trade case
- Timeline entries reflect state changes from registration, banking, customs, shipment, and delivery milestones
- Notifications and audit logs are generated from significant case events

---

## 8. Module Boundaries

### Module: Authentication and User Management
Responsibility:
- User login, registration, password recovery, and session management
- Role and permission assignment

Boundaries:
- Shared platform concern used by all modules

### Module: Company Management
Responsibility:
- Manage company profiles and company-level settings
- Associate users to companies

Boundaries:
- Top-level organizational boundary for all trade cases

### Module: Trade Case Management
Responsibility:
- Create and manage the central trade-case records
- Track case status, participants, comments, and lifecycle milestones

Boundaries:
- The primary operational module of the platform
- Other modules attach to this entity

### Module: Iran NTSW Monitoring
Responsibility:
- Track NTSW-related status updates and alerts
- Show monitoring history for the trade case
- Provide visibility into official process updates

Boundaries:
- Specialized monitoring module tied to trade cases

### Module: Registration Order
Responsibility:
- Manage registration order data and progress
- Connect registration events to the parent trade case

Boundaries:
- Early-stage workflow domain

### Module: Currency Request
Responsibility:
- Track currency request creation and status
- Support approval-related workflow visibility

Boundaries:
- Finance-oriented domain closely tied to trade-case progress

### Module: Bank Approval Status
Responsibility:
- Record approval outcomes and pending banking actions
- Provide clear status visibility for operational teams

Boundaries:
- Decision-state domain attached to the trade case

### Module: Customs Declaration
Responsibility:
- Manage customs declaration details and declaration progress
- Track declaration status as part of the case lifecycle

Boundaries:
- Compliance and customs domain

### Module: Shipment Tracking
Responsibility:
- Track shipment movement and milestones
- Link shipment updates to the trade case

Boundaries:
- Logistics monitoring domain

### Module: Document Checklist
Responsibility:
- Maintain required document records and completion status
- Highlight missing or pending documents

Boundaries:
- Shared supporting module for all trade-case phases

### Module: Process Timeline
Responsibility:
- Present a chronological view of major case events
- Show state progression across registration, banking, customs, and shipment stages

Boundaries:
- Read-focused monitoring module that aggregates data from other domains

### Module: Notifications
Responsibility:
- Send in-app and email alerts about trade-case events
- Notify users about NTSW updates, approvals, and overdue tasks

Boundaries:
- Event-driven module linked to trade-case actions

### Module: Audit Logs
Responsibility:
- Record important changes across the platform
- Support review and compliance requirements

Boundaries:
- Cross-cutting concern used by all modules

---

## 9. Suggested Domain Services

The backend should remain modular and focused on trade monitoring rather than broad ERP functionality.

### Authentication service
- login, logout, password reset, role checks

### Company service
- company lifecycle and user-company association

### Trade case service
- trade-case creation, assignment, updates, status transitions

### NTSW monitoring service
- ingest and display NTSW status updates and alerts

### Registration order service
- create and update registration order records

### Currency request service
- manage currency requests and related status transitions

### Bank approval service
- track bank approval outcomes

### Customs declaration service
- manage customs declarations and status updates

### Shipment tracking service
- manage shipment milestones and tracking references

### Document checklist service
- manage required-document state and completion status

### Timeline service
- assemble process events into a readable chronological view

### Notification service
- event-based user alerts

### Audit service
- centralized audit event logging

---

## 10. MVP Development Roadmap

### Phase 0 - Foundation
- Set up Next.js App Router project
- Add TypeScript, Tailwind CSS, and shadcn/ui
- Create base layout, navigation, and theming
- Configure Prisma and PostgreSQL connection
- Establish environment configuration

### Phase 1 - Core Identity and Company Setup
- Authentication and user roles
- Company management
- Basic dashboard shell and profile settings

### Phase 2 - Trade Case Core
- Create the TradeCase entity and data model
- Case creation, editing, status tracking, and comments
- Basic list and detail pages for trade cases

### Phase 3 - Monitoring Domains for MVP
- Registration Order management
- Document Checklist management
- Process Timeline view
- Basic NTSW monitoring module

### Phase 4 - Operational Workflow Expansion
- Currency Request module
- Bank Approval Status tracking
- Customs Declaration module
- Shipment Tracking module

### Phase 5 - Collaboration and Oversight
- Notifications
- Audit logs
- Role-based views and simple reporting
- Dashboard summaries for case progress and delays

### Phase 6 - Hardening and Scale
- Performance tuning
- Security hardening
- Deployment automation and observability

---

## 11. MVP Priority Order

### P0 - Must have for first release
- Authentication and user management
- Company management
- Trade case management
- Registration Order
- Document Checklist
- Process Timeline
- Iran NTSW monitoring

### P1 - Important for usability
- Currency Request
- Bank Approval Status
- Customs Declaration
- Shipment Tracking
- Notifications

### P2 - Valuable enhancements
- Advanced dashboard analytics
- Detailed audit views
- Exportable reports
- Automated escalation rules

---

## 12. Recommended MVP Scope

The first release should stay focused on the core promise of PTMS:
- company and user setup
- trade-case creation and tracking
- registration-order and document tracking
- NTSW monitoring visibility
- process timeline and status clarity

This keeps the MVP practical, focused, and aligned with the platform’s purpose as a foreign trade monitoring system.

---

## 13. Non-Functional Requirements

- Secure authentication and authorization
- Role-based access control
- Clear auditability of critical events
- Responsive UI for desktop and tablet use
- Fast search and filtering over trade cases and monitoring data
- Clear error handling and validation
- Support for future expansion into deeper compliance and workflow automation

---

## 14. Recommended Implementation Strategy

1. Start with the core platform shell and authentication
2. Build company and user infrastructure first
3. Implement the TradeCase as the central domain model
4. Add the monitoring and process-tracking modules around the trade case
5. Layer notifications, auditability, and reporting iteratively
