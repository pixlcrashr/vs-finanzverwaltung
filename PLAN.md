# Implementation Plan: Anträge & Kostenerstattung

This document outlines the data models, routes, and requirements for implementing the "Anträge" (Applications) and "Kostenerstattung" (Reimbursements) features.

---

## Table of Contents

1. [Frontend Routes](#frontend-routes)
2. [Anträge (Applications)](#anträge-applications)
   - [Data Model](#application-data-model)
   - [Statuses & Workflow](#application-statuses--workflow)
   - [Public ID Format](#application-public-id-format)
   - [Finanzantrag Specifics](#finanzantrag-financial-application-specifics)
   - [Comments & Audit Log](#application-comments--audit-log)
3. [Kostenerstattung (Reimbursements)](#kostenerstattung-reimbursements)
   - [Data Model](#reimbursement-data-model)
   - [Invoice Items](#invoice-items)
   - [Statuses & Workflow](#reimbursement-statuses--workflow)
   - [Public ID Format](#reimbursement-public-id-format)
   - [Comments & Audit Log](#reimbursement-comments--audit-log)
4. [Shared Concepts](#shared-concepts)
   - [Committees](#committees)
   - [User Groups](#user-groups)
   - [Audit Logging](#audit-logging)
5. [API Endpoints Overview](#api-endpoints-overview)
6. [Database Schema](#database-schema)

---

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/applications` | List of all applications (Anträge) |
| `/applications/new` | Create new application |
| `/applications/:id` | View/Edit application |
| `/reimbursements` | List of all reimbursements (Kostenerstattungen) |
| `/reimbursements/new` | Create new reimbursement |
| `/reimbursements/:id` | View/Edit reimbursement |

**Removed Routes:**
- `/application-types` (no longer needed)

---

## Anträge (Applications)

### Application Data Model

```typescript
interface Application {
  // Identity
  id: string;                          // UUID (internal)
  publicId: string;                    // Format: "YYYY/XX" (e.g., "2026/01")

  // Type
  type: ApplicationType;               // 'general' | 'financial'

  // Metadata (auto-generated)
  createdAt: Date;                     // Server-generated
  updatedAt: Date;                     // Server-generated

  // User Information
  createdByUserId: string;             // UUID of creating user
  createdByUserFullName: string;       // Cached full name at creation time

  // Committee & Group
  committeeId: string;                 // Selected committee (e.g., "AStA")
  userGroupId: string | null;          // Optional: User's group membership

  // Content
  decisionQuestion: string;            // "What should the committee decide?"
  decisionReason: string;              // "Why should they decide?"

  // Status
  status: ApplicationStatus;

  // Financial Application specific (only when type === 'financial')
  financialDetails?: FinancialApplicationDetails;

  // Assigned Users (for financial applications)
  assignedUserIds: string[];           // Users who can submit invoices
}

enum ApplicationType {
  GENERAL = 'general',                 // Allgemeiner Antrag
  FINANCIAL = 'financial'              // Finanzantrag
}

enum ApplicationStatus {
  DRAFT = 'draft',                     // Initial state (editable by user)
  QUEUED_FOR_AGENDA = 'queued_for_agenda',  // Admin queued, user can edit
  CHANGES_REQUIRED = 'changes_required',     // Admin requests changes
  REJECTED = 'rejected',               // Admin rejected
  ACCEPTED = 'accepted',               // Admin accepted
  COMPLETED = 'completed',             // Fully processed
  DECAYED = 'decayed'                  // Auto-set after decay time (financial only)
}
```

### Application Statuses & Workflow

```
                                    ┌─────────────────┐
                                    │     DRAFT       │
                                    │ (user editable) │
                                    └────────┬────────┘
                                             │ Admin action
                                             ▼
                                    ┌─────────────────┐
                              ┌─────│ QUEUED_FOR_AGENDA│◄────┐
                              │     │ (user editable) │     │
                              │     └────────┬────────┘     │
                              │              │              │
                    Admin     │              │ Admin        │ User submits
                    rejects   │              │ reviews      │ changes
                              │              ▼              │
                              │     ┌─────────────────┐     │
                              │     │CHANGES_REQUIRED │─────┘
                              │     │ (user editable) │
                              │     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │    REJECTED     │
                     │   (terminal)    │
                     └─────────────────┘

                              │ (from QUEUED_FOR_AGENDA)
                              │ Admin accepts
                              ▼
                     ┌─────────────────┐
                     │    ACCEPTED     │──────┐
                     │                 │      │ Decay timer
                     └────────┬────────┘      │ (financial only)
                              │               ▼
                    Admin     │      ┌─────────────────┐
                    completes │      │    DECAYED      │
                              │      │   (terminal)    │
                              ▼      └─────────────────┘
                     ┌─────────────────┐
                     │   COMPLETED     │
                     │   (terminal)    │
                     └─────────────────┘
```

**Editing Permissions:**
- **User can edit:** `DRAFT`, `QUEUED_FOR_AGENDA`, `CHANGES_REQUIRED`
- **Admin can edit:** All statuses (with audit logging)
- **Terminal statuses:** `REJECTED`, `COMPLETED`, `DECAYED` (no further edits)

### Application Public ID Format

- Format: `YYYY/XX`
- `YYYY`: Year of creation
- `XX`: Unique sequential integer per year, starting at 1
- Example: `2026/01`, `2026/02`, `2026/42`

**Implementation Notes:**
- Use a database sequence or counter table per year
- Reset counter on year change
- Public ID is immutable once assigned

### Finanzantrag (Financial Application) Specifics

```typescript
interface FinancialApplicationDetails {
  // Budget
  suggestedBudgetId: string | null;    // User-suggested budget
  confirmedBudgetId: string | null;    // Admin-confirmed budget

  // Invoice Submission Deadline
  suggestedInvoiceDeadline: Date | null;  // User-suggested deadline
  confirmedInvoiceDeadline: Date | null;  // Admin-confirmed deadline

  // Decay Configuration
  decayDuration: number | null;        // Days until auto-decay after acceptance
  decayAt: Date | null;                // Calculated: acceptedAt + decayDuration

  // Cost Items
  costItems: CostItem[];

  // Totals (calculated, but can be overridden by admin)
  totalExpectedCost: number;           // Sum of cost items expected costs
  totalEstimatedCost: number;          // Sum of cost items estimated costs
  adminOverrideTotalExpected: number | null;  // Admin override
  adminOverrideTotalEstimated: number | null; // Admin override
}

interface CostItem {
  id: string;                          // UUID
  summary: string;                     // Required: Brief description
  description: string | null;          // Optional: Detailed description
  expectedCost: number;                // Required: Expected cost in cents
  estimatedCost: number;               // Required: Estimated cost in cents
  links: string[];                     // Optional: Array of URLs

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  lastModifiedByUserId: string;
}
```

**Admin Overrides:**
- Admin can modify individual cost items (logged in audit)
- Admin can override total values independent of item sum
- All changes are recorded in audit log

**Decay Mechanism:**
- When status changes to `ACCEPTED`, calculate `decayAt = now + decayDuration`
- Background job checks for `decayAt < now` and sets status to `DECAYED`
- Decay only applies to financial applications

### Application Comments & Audit Log

```typescript
interface ApplicationComment {
  id: string;                          // UUID
  applicationId: string;               // Reference to application

  // Author
  authorUserId: string;
  authorUserFullName: string;          // Cached at creation

  // Content
  content: string;                     // Markdown supported

  // Status Change (optional)
  statusChange?: {
    from: ApplicationStatus;
    to: ApplicationStatus;
  };

  // Visibility
  isAdminOnly: boolean;                // If true, only visible to admins

  // Metadata
  createdAt: Date;
}

interface ApplicationAuditEntry {
  id: string;                          // UUID
  applicationId: string;

  // Actor
  actorUserId: string;
  actorUserFullName: string;

  // Change Details
  action: AuditAction;                 // 'create' | 'update' | 'status_change' | 'assign_user' | etc.
  fieldName: string | null;            // Which field changed
  oldValue: string | null;             // JSON-serialized old value
  newValue: string | null;             // JSON-serialized new value

  // Metadata
  timestamp: Date;
}
```

---

## Kostenerstattung (Reimbursements)

### Reimbursement Data Model

```typescript
interface Reimbursement {
  // Identity
  id: string;                          // UUID (internal)
  publicId: string;                    // Format: "YYYY/XX"

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  // User Information
  createdByUserId: string;
  createdByUserFullName: string;       // Cached at creation

  // Committee
  committeeId: string;                 // Selected from predefined list

  // Reference to Financial Application (optional)
  financialApplicationId: string | null;

  // Content
  notice: string | null;               // Optional general notice

  // Payment Method
  paymentMethod: PaymentMethod;
  bankDetails?: BankDetails;           // Required if paymentMethod === 'bank_transfer'

  // Invoice Items
  invoiceItems: InvoiceItem[];

  // Status
  status: ReimbursementStatus;
}

enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',     // Überweisung (IBAN/BIC)
  CASH = 'cash',                       // Barzahlung
  DIRECT_INVOICE = 'direct_invoice'    // Direct transfer to invoice recipient
}

interface BankDetails {
  iban: string;
  bic: string | null;                  // Optional for domestic transfers
  accountHolder: string;
}

enum ReimbursementStatus {
  PENDING = 'pending',                 // Initial state after creation
  FURTHER_INFO_REQUIRED = 'further_info_required',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}
```

### Invoice Items

```typescript
interface InvoiceItem {
  id: string;                          // UUID (internal)
  publicId: string;                    // Format: "YYYY/ZZ" (per type per year)
  reimbursementId: string;

  // Type
  type: InvoiceItemType;

  // Content
  description: string | null;
  amount: number;                      // Amount in cents

  // Attachments (minimum 1 required)
  attachments: Attachment[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

enum InvoiceItemType {
  RECEIPT = 'receipt',                 // Kassenbon (requires original)
  INVOICE = 'invoice'                  // Rechnung (digital OK)
}

interface Attachment {
  id: string;                          // UUID
  invoiceItemId: string;

  fileName: string;
  mimeType: string;
  fileSize: number;                    // Bytes
  storageKey: string;                  // Reference to file storage

  uploadedAt: Date;
}
```

**Receipt Notice:**
For items with `type === 'receipt'`:
- Display warning: "Kassenbons müssen im Original eingereicht werden. Ein Screenshot oder Foto ist nicht ausreichend."
- Track whether original has been received (admin field)

```typescript
interface InvoiceItem {
  // ... existing fields ...

  // Receipt-specific (only when type === 'receipt')
  originalReceived: boolean;           // Admin confirms original receipt received
  originalReceivedAt: Date | null;
  originalReceivedByUserId: string | null;
}
```

### Reimbursement Statuses & Workflow

```
                     ┌─────────────────┐
                     │    PENDING      │
                     │ (after creation)│
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │  COMPLETED  │ │FURTHER_INFO │ │  REJECTED   │
     │  (terminal) │ │  REQUIRED   │ │  (terminal) │
     └─────────────┘ └──────┬──────┘ └─────────────┘
                            │
                            │ User provides info
                            │ (returns to PENDING)
                            ▼
                     ┌─────────────────┐
                     │    PENDING      │
                     └─────────────────┘
```

### Reimbursement Public ID Format

There are **three separate ID sequences** for reimbursements:

#### 1. Reimbursement (Kostenerstattung) ID
- Format: `YYYY/XX`
- `YYYY`: Year of creation
- `XX`: Unique sequential integer per year for reimbursements
- **Separate sequence from Application IDs** (both use `YYYY/XX` but are independent)
- Example: `2026/01`, `2026/02`, `2026/15`

#### 2. Receipt (Kassenbon) Item ID
- Format: `R-YYYY/ZZ`
- Prefix `R-` indicates receipt type
- `ZZ`: Unique sequential integer per year across ALL reimbursements
- Example: `R-2026/01`, `R-2026/02`, `R-2026/42`

#### 3. Invoice (Rechnung) Item ID
- Format: `I-YYYY/ZZ`
- Prefix `I-` indicates invoice type
- `ZZ`: Unique sequential integer per year across ALL reimbursements
- Example: `I-2026/01`, `I-2026/02`, `I-2026/37`

**Complete Example:**
```
Kostenerstattung: 2026/05         ← Reimbursement public ID
├── Invoice Item (receipt):  R-2026/12   ← 12th receipt of 2026 (across all reimbursements)
├── Invoice Item (invoice):  I-2026/08   ← 8th invoice of 2026 (across all reimbursements)
└── Invoice Item (receipt):  R-2026/13   ← 13th receipt of 2026

Kostenerstattung: 2026/06         ← Next reimbursement
├── Invoice Item (receipt):  R-2026/14   ← Continues from R-2026/13
└── Invoice Item (invoice):  I-2026/09   ← Continues from I-2026/08
```

**Summary of ID Sequences:**
| Entity | Format | Sequence Scope |
|--------|--------|----------------|
| Application (Antrag) | `YYYY/XX` | Per year, all application types |
| Reimbursement (Kostenerstattung) | `YYYY/XX` | Per year, separate from applications |
| Receipt Item (Kassenbon) | `R-YYYY/ZZ` | Per year, across all reimbursements |
| Invoice Item (Rechnung) | `I-YYYY/ZZ` | Per year, across all reimbursements |

### Reimbursement Comments & Audit Log

Same structure as Application comments and audit log:

```typescript
interface ReimbursementComment {
  id: string;
  reimbursementId: string;

  authorUserId: string;
  authorUserFullName: string;

  content: string;

  statusChange?: {
    from: ReimbursementStatus;
    to: ReimbursementStatus;
  };

  isAdminOnly: boolean;
  createdAt: Date;
}

interface ReimbursementAuditEntry {
  id: string;
  reimbursementId: string;

  actorUserId: string;
  actorUserFullName: string;

  action: AuditAction;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;

  timestamp: Date;
}
```

---

## Shared Concepts

### Committees

Predefined list of committees that can be selected for applications and reimbursements.

```typescript
interface Committee {
  id: string;                          // UUID
  name: string;                        // e.g., "AStA", "StuPa"
  description: string | null;
  isActive: boolean;                   // Soft delete

  createdAt: Date;
  updatedAt: Date;
}
```

**Initial Data:**
- AStA (Allgemeiner Studierendenausschuss)

**Admin Features:**
- List, create, update, soft-delete committees

### User Groups

Configurable groups that users can belong to.

```typescript
interface UserGroup {
  id: string;                          // UUID
  name: string;                        // e.g., "Fachschaft Informatik"
  description: string | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Many-to-many relationship
interface UserGroupMembership {
  userId: string;
  userGroupId: string;

  joinedAt: Date;
}
```

**Admin Features:**
- CRUD operations on user groups
- Manage group memberships

**User Features:**
- Select their group when creating applications (or "none")

### Audit Logging

Generic audit log entry structure used across features:

```typescript
enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  ASSIGN_USER = 'assign_user',
  UNASSIGN_USER = 'unassign_user',
  ADD_COMMENT = 'add_comment',
  ADD_ATTACHMENT = 'add_attachment',
  REMOVE_ATTACHMENT = 'remove_attachment',
  CONFIRM_ORIGINAL_RECEIVED = 'confirm_original_received'
}
```

**Display in UI:**
- Admin edit pages show full audit log
- Timeline view similar to GitHub issues
- Filter by action type, user, date range

---

## API Endpoints Overview

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List applications (with filters) |
| POST | `/api/applications` | Create application |
| GET | `/api/applications/:id` | Get application details |
| PATCH | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application (admin only) |
| POST | `/api/applications/:id/status` | Change status (admin only) |
| POST | `/api/applications/:id/comments` | Add comment |
| GET | `/api/applications/:id/comments` | List comments |
| GET | `/api/applications/:id/audit` | Get audit log |
| POST | `/api/applications/:id/assignments` | Assign user (admin only) |
| DELETE | `/api/applications/:id/assignments/:userId` | Unassign user |

### Application Cost Items (Financial Applications)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications/:id/cost-items` | List cost items |
| POST | `/api/applications/:id/cost-items` | Add cost item |
| PATCH | `/api/applications/:id/cost-items/:itemId` | Update cost item |
| DELETE | `/api/applications/:id/cost-items/:itemId` | Delete cost item |

### Reimbursements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reimbursements` | List reimbursements |
| POST | `/api/reimbursements` | Create reimbursement |
| GET | `/api/reimbursements/:id` | Get reimbursement details |
| PATCH | `/api/reimbursements/:id` | Update reimbursement |
| DELETE | `/api/reimbursements/:id` | Delete reimbursement (admin) |
| POST | `/api/reimbursements/:id/status` | Change status (admin) |
| POST | `/api/reimbursements/:id/comments` | Add comment |
| GET | `/api/reimbursements/:id/comments` | List comments |
| GET | `/api/reimbursements/:id/audit` | Get audit log |

### Reimbursement Invoice Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reimbursements/:id/invoice-items` | List invoice items |
| POST | `/api/reimbursements/:id/invoice-items` | Add invoice item |
| PATCH | `/api/reimbursements/:id/invoice-items/:itemId` | Update invoice item |
| DELETE | `/api/reimbursements/:id/invoice-items/:itemId` | Delete invoice item |
| POST | `/api/reimbursements/:id/invoice-items/:itemId/attachments` | Upload attachment |
| DELETE | `/api/.../attachments/:attachmentId` | Delete attachment |
| POST | `/api/.../invoice-items/:itemId/confirm-original` | Confirm original received |

### Committees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/committees` | List committees |
| POST | `/api/committees` | Create committee (admin) |
| PATCH | `/api/committees/:id` | Update committee (admin) |
| DELETE | `/api/committees/:id` | Delete committee (admin) |

### User Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user-groups` | List user groups |
| POST | `/api/user-groups` | Create user group (admin) |
| PATCH | `/api/user-groups/:id` | Update user group (admin) |
| DELETE | `/api/user-groups/:id` | Delete user group (admin) |
| GET | `/api/user-groups/:id/members` | List members |
| POST | `/api/user-groups/:id/members` | Add member (admin) |
| DELETE | `/api/user-groups/:id/members/:userId` | Remove member |

---

## Database Schema

### Tables Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATIONS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ applications                    │ Main application table                     │
│ application_cost_items          │ Cost items for financial applications     │
│ application_comments            │ Comments on applications                   │
│ application_audit_log           │ Audit trail for applications              │
│ application_user_assignments    │ Users assigned to applications            │
│ application_public_id_sequence  │ Counter for public IDs per year           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                             REIMBURSEMENTS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ reimbursements                  │ Main reimbursement table                   │
│ reimbursement_invoice_items     │ Invoice items within reimbursements       │
│ reimbursement_attachments       │ File attachments for invoice items        │
│ reimbursement_comments          │ Comments on reimbursements                │
│ reimbursement_audit_log         │ Audit trail for reimbursements            │
│ reimbursement_public_id_seq     │ Counter for reimbursement public IDs      │
│ invoice_item_receipt_seq        │ Counter for receipt public IDs            │
│ invoice_item_invoice_seq        │ Counter for invoice public IDs            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 SHARED                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ committees                      │ Available committees                       │
│ user_groups                     │ User groups                                │
│ user_group_memberships          │ User-to-group assignments                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Indexes

```sql
-- Applications
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_applications_created_by ON applications(created_by_user_id);
CREATE INDEX idx_applications_committee ON applications(committee_id);
CREATE INDEX idx_applications_public_id ON applications(public_id);
CREATE INDEX idx_applications_decay_at ON applications(decay_at) WHERE decay_at IS NOT NULL;

-- Reimbursements
CREATE INDEX idx_reimbursements_status ON reimbursements(status);
CREATE INDEX idx_reimbursements_created_by ON reimbursements(created_by_user_id);
CREATE INDEX idx_reimbursements_financial_app ON reimbursements(financial_application_id);
CREATE INDEX idx_reimbursements_public_id ON reimbursements(public_id);

-- Invoice Items
CREATE INDEX idx_invoice_items_reimbursement ON reimbursement_invoice_items(reimbursement_id);
CREATE INDEX idx_invoice_items_type ON reimbursement_invoice_items(type);

-- Audit Logs
CREATE INDEX idx_app_audit_application ON application_audit_log(application_id);
CREATE INDEX idx_app_audit_timestamp ON application_audit_log(timestamp);
CREATE INDEX idx_reimb_audit_reimbursement ON reimbursement_audit_log(reimbursement_id);
CREATE INDEX idx_reimb_audit_timestamp ON reimbursement_audit_log(timestamp);
```

---

## Implementation Checklist

### Phase 1: Backend Foundation
- [ ] Create database migrations for all tables
- [ ] Implement GORM models
- [ ] Generate type-safe queries with gorm-gen
- [ ] Implement repository layer

### Phase 2: API Endpoints
- [ ] Committees CRUD
- [ ] User Groups CRUD
- [ ] Applications CRUD with status workflow
- [ ] Application comments & audit
- [ ] Financial application specifics (cost items, assignments)
- [ ] Reimbursements CRUD with status workflow
- [ ] Invoice items with attachments
- [ ] Reimbursement comments & audit

### Phase 3: Background Jobs
- [ ] Application decay checker (cron job)
- [ ] Notification triggers (status changes)

### Phase 4: Frontend
- [ ] Remove old `/applications` and `/application-types` routes
- [ ] Implement new `/applications` route
- [ ] Implement `/reimbursements` route
- [ ] Admin views with audit log display
- [ ] File upload for attachments

### Phase 5: Testing & Documentation
- [ ] API tests
- [ ] Integration tests
- [ ] OpenAPI documentation
- [ ] User guide

---

## Notes & Decisions

1. **Public ID Generation**: Use a dedicated sequence table per entity type to ensure gap-free sequential IDs per year. Reset sequence on year change.

2. **Audit Logging**: All mutations must go through service layer that handles audit logging. Never bypass for admin operations.

3. **File Storage**: Attachments stored in object storage (e.g., S3-compatible). Only metadata in database.

4. **Decimal Handling**: All monetary values stored as integers (cents) to avoid floating-point issues. Use `cockroachdb/apd` for calculations.

5. **Soft Deletes**: Committees and User Groups use soft delete (`is_active` flag). Applications and Reimbursements are truly deleted (with cascade).

6. **Caching User Names**: Store `createdByUserFullName` at creation time to preserve historical accuracy even if user name changes later.
