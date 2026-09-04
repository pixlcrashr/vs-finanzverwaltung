# XML Export/Import Specification

This document defines the XML format used to export and import an organization's
complete budget planning image — accounts, budgets (including revisions and
values), account groups, ledger accounts/years, transactions and transaction
assignments. The format intentionally contains **no organization record**; it is
always scoped to a single organization and must be imported into a target
organization by the caller.

The format is versioned. The current version is **1**.

All element and attribute names use **camelCase**.

## Document structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<vsfvExport version="1" exportedAt="2026-09-02T12:00:00Z">
  <accounts>...</accounts>
  <accountGroups>...</accountGroups>
  <ledgerAccounts>...</ledgerAccounts>
  <ledgerYears>...</ledgerYears>
  <budgets>...</budgets>
  <transactions>...</transactions>
</vsfvExport>
```

## Attributes on `vsfvExport`

| Attribute | Type | Description |
|-----------|------|-------------|
| `version` | int  | Format version. Must be `1`. |
| `exportedAt` | ISO 8601 timestamp | Export timestamp (RFC 3339). Ignored on import. |

## Sections

### `<accounts>`

Root accounts are listed directly under `<accounts>`. Child accounts are nested
recursively inside `<children>` of their parent. Every account keeps its original
UUID as `id`, so cross-references inside the document are stable.

```xml
<account id="uuid" customId="string" parentAccountId="uuid"
         displayName="string" displayCode="string"
         displayDescription="string" isContainer="false"
         isArchived="false">
  <children>
    <account>...</account>
  </children>
</account>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `id` | yes | Original account UUID. |
| `customId` | no | Custom identifier; falls back to `id` when absent. |
| `parentAccountId` | no | Parent account `id`. Only present for non-root accounts. |
| `displayName` | yes | Human-readable name. |
| `displayCode` | no | Account code/number. |
| `displayDescription` | no | Optional description. |
| `isContainer` | yes | `true` when the account may only hold children. |
| `isArchived` | yes | `true` when the account is archived. |

### `<accountGroups>`

An account group and its member assignments.

```xml
<accountGroup id="uuid" customId="string" displayName="string"
              displayDescription="string">
  <accountGroupAssignments>
    <accountGroupAssignment accountId="uuid" negate="false"/>
  </accountGroupAssignments>
</accountGroup>
```

### `<ledgerAccounts>`

Ledger accounts used by transactions.

```xml
<ledgerAccount id="uuid" customId="string" code="1000"
               accountType="asset" displayName="string"
               displayDescription="string"/>
```

`accountType` values: `unspecified`, `asset`, `liability`, `equity`, `revenue`,
`expense`, `system`. Defaults to `unspecified` when missing.

### `<ledgerYears>`

Fiscal/ledger years.

```xml
<ledgerYear id="uuid" customId="string" year="2026" isClosed="false"/>
```

### `<budgets>`

A budget with base account values and ordered revisions.

```xml
<budget id="uuid" customId="string" displayName="string"
        displayDescription="string" periodStart="2026-01-01"
        periodEnd="2026-12-31" isClosed="false"
        isPublished="false" publishActualValues="false">
  <accountValues>
    <accountValue accountId="uuid" value="1234.56"/>
  </accountValues>
  <budgetRevisions>
    <budgetRevision id="uuid" customId="string" displayName="Nachtrag I"
                    displayDescription="string" date="2026-03-15">
      <accountValues>...</accountValues>
    </budgetRevision>
  </budgetRevisions>
</budget>
```

Dates are formatted as `YYYY-MM-DD`. Decimal values are represented as strings to
avoid precision loss.

#### `<budgetRevision>` attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `id` | yes | Original revision UUID. |
| `customId` | no | Custom identifier; falls back to `id` when absent. |
| `displayName` | no | Human-readable name, e.g. `"Nachtrag I"`. Falls back to the revision `date` (`YYYY-MM-DD`) on import when absent. |
| `displayDescription` | no | Optional description. |
| `date` | yes | Revision date (`YYYY-MM-DD`). |

### `<transactions>`

Journal transactions and their account assignments.

```xml
<transaction id="uuid" customId="string"
             creditLedgerAccountId="uuid"
             debitLedgerAccountId="uuid"
             amount="1234.56" description="string" reference="string"
             bookedAt="2026-01-15" documentDate="2026-01-15"
             assignedAccountId="uuid">
  <transactionAssignments>
    <transactionAssignment accountId="uuid" value="1234.56"/>
  </transactionAssignments>
</transaction>
```

`assignedAccountId` is a legacy single assignment. On import it is ignored when
explicit `<transactionAssignments>` are present; otherwise an assignment with the full
transaction amount is created for the referenced account.

## Versioning

New versions must use a different `version` attribute. Parsers must reject
unknown versions. Backward-compatible additions within version `1` use optional
attributes or elements with sensible defaults.
