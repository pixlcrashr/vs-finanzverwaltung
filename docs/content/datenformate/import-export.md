---
title: Import/Export-Format
weight: 1
---

VSFV verwendet ein versioniertes JSON-Format fuer den Import und Export von Haushaltsdaten einer Organisation.
Das Format deckt Konten (`accounts`), Budgets (`budgets`), Budgetrevisionen (`budget_revisions`) sowie die zugehoerigen Planwerte (`budget_account_values`, `budget_revision_account_values`) ab.

## Versionshistorie

| Version | Aenderungen |
|---------|-------------|
| `1` | Initiales Format. Konten, Budgets, Revisionen und Planwerte. |

---

## Toplevel-Struktur

```json
{
  "version": 1,
  "exported_at": "2024-01-15T10:30:00Z",
  "accounts": [ ... ],
  "budgets": [ ... ]
}
```

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `version` | `integer` | ja | Formatversion. Aktuell immer `1`. |
| `exported_at` | `string` (RFC 3339) | nein | Zeitstempel des Exports. Wird beim Import ignoriert. |
| `accounts` | `Account[]` | ja | Liste aller Konten der Organisation. |
| `budgets` | `Budget[]` | ja | Liste aller Budgets inkl. Revisionen und Planwerten. |

---

## Account

Repraesentiert ein Haushaltskonto.

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "display_name": "Einnahmen",
  "display_code": "1",
  "display_description": "Alle Einnahmen der Organisation",
  "is_container": true,
  "is_archived": false,
  "children": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "display_name": "Mitgliedsbeitraege",
      "display_code": "1.1",
      "display_description": "",
      "is_container": false,
      "is_archived": false,
      "children": []
    }
  ]
}
```

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string` (UUID v4) | ja | Referenz-ID innerhalb der Importdatei (Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Wird **nicht** als Datenbankschluessel verwendet; die Datenbank vergibt neue UUIDs. Muss innerhalb der Datei eindeutig sein. |
| `display_name` | `string` | ja | Anzeigename des Kontos. |
| `display_code` | `string` | ja | Kontonummer (z.B. `"1"`, `"1.1"`, `"200"`). |
| `display_description` | `string` | nein | Optionale Beschreibung. Leerer String oder weggelassen wird als leer behandelt. |
| `is_container` | `boolean` | nein | `true`, wenn das Konto nur Unterkonten enthaelt und keine direkten Buchungen erlaubt. Wird automatisch auf `true` gesetzt, wenn `children` nicht leer ist. Standard: `false`. |
| `is_archived` | `boolean` | nein | `true`, wenn das Konto archiviert ist. Standard: `false`. |
| `children` | `Account[]` | nein | Unterkonten. Die `accounts`-Liste auf Toplevel enthaelt ausschliesslich Wurzelkonten; alle Unterkonten werden rekursiv in `children` eingebettet. |

---

## Budget

Repraesentiert ein Budget mit optionalen Planwerten und Revisionen.

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "display_name": "Haushalt 2024",
  "display_description": "Jahreshaushalt 2024",
  "period_start": "2024-01-01",
  "period_end": "2024-12-31",
  "is_closed": false,
  "account_values": {
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "50000.00"
  },
  "revisions": [
    {
      "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
      "display_name": "Nachtrag I",
      "display_description": "Erster Nachtrag zum Haushalt 2024",
      "date": "2024-06-01",
      "account_values": {
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "55000.00"
      }
    }
  ]
}
```

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string` (UUID v4) | ja | Referenz-ID innerhalb der Importdatei (Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Wird **nicht** als Datenbankschluessel verwendet. Muss innerhalb der Datei eindeutig sein. |
| `display_name` | `string` | ja | Anzeigename des Budgets. |
| `display_description` | `string` | nein | Optionale Beschreibung. |
| `period_start` | `string` (YYYY-MM-DD) | ja | Beginn des Haushaltszeitraums. |
| `period_end` | `string` (YYYY-MM-DD) | ja | Ende des Haushaltszeitraums. |
| `is_closed` | `boolean` | nein | `true`, wenn das Budget abgeschlossen ist. Standard: `false`. |
| `account_values` | `object` (`{ [account_id: UUID]: string }`) | nein | Planwerte fuer dieses Budget ohne Bezug zu einer Revision (Basisplan). Schluessel ist die `id` eines Kontos aus dieser Datei, Wert der Planwert als Dezimalstring. Leeres Objekt oder weggelassen bedeutet keine Planwerte. |
| `revisions` | `BudgetRevision[]` | nein | Revisionen des Budgets in Erstellungsreihenfolge (aelteste zuerst). |

---

## BudgetRevision

Eine Revision (Nachtrag) eines Budgets.

```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "display_name": "Nachtrag I",
  "display_description": "Erster Nachtrag zum Haushalt 2024",
  "date": "2024-06-01",
  "account_values": {
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "55000.00"
  }
}
```

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string` (UUID v4) | ja | Referenz-ID innerhalb der Importdatei (Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Muss innerhalb der Datei eindeutig sein. |
| `display_name` | `string` | nein | Anzeigename der Revision (z.B. `"Nachtrag I"`). |
| `display_description` | `string` | nein | Optionale Beschreibung. |
| `date` | `string` (YYYY-MM-DD) | ja | Datum der Revision. |
| `account_values` | `object` (`{ [account_id: UUID]: string }`) | nein | Planwerte der Konten fuer diese Revision. Schluessel ist die `id` eines Kontos, Wert der Planwert als Dezimalstring. |

---

## Vollstaendiges Beispiel

```json
{
  "version": 1,
  "exported_at": "2024-01-15T10:30:00Z",
  "accounts": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "display_name": "Einnahmen",
      "display_code": "1",
      "display_description": "Alle Einnahmen",
      "is_container": true,
      "is_archived": false,
      "children": [
        {
          "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          "display_name": "Mitgliedsbeitraege",
          "display_code": "1.1",
          "display_description": "",
          "is_container": false,
          "is_archived": false,
          "children": []
        }
      ]
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "display_name": "Ausgaben",
      "display_code": "2",
      "display_description": "Alle Ausgaben",
      "is_container": true,
      "is_archived": false,
      "children": [
        {
          "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
          "display_name": "Veranstaltungen",
          "display_code": "2.1",
          "display_description": "",
          "is_container": false,
          "is_archived": false,
          "children": []
        }
      ]
    }
  ],
  "budgets": [
    {
      "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
      "display_name": "Haushalt 2024",
      "display_description": "Jahreshaushalt SoSe/WiSe 2024",
      "period_start": "2024-01-01",
      "period_end": "2024-12-31",
      "is_closed": false,
      "account_values": {
        "b2c3d4e5-f6a7-8901-bcde-f12345678901": "40000.00",
        "d4e5f6a7-b8c9-0123-defa-234567890123": "15000.00"
      },
      "revisions": [
        {
          "id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
          "display_name": "Nachtrag I",
          "display_description": "Anpassung nach Semesterbeginn",
          "date": "2024-04-15",
          "account_values": {
            "b2c3d4e5-f6a7-8901-bcde-f12345678901": "42000.00",
            "d4e5f6a7-b8c9-0123-defa-234567890123": "18000.00"
          }
        }
      ]
    }
  ]
}
```

---

## Import-Semantik

- **Transaktion:** Ein Import laeuft vollstaendig in einer Datenbanktransaktion. Entweder werden alle Datensaetze importiert oder – bei einem Fehler – keiner (Alles-oder-nichts-Prinzip).
- **IDs:** Alle `id`-Felder muessen gueltige UUIDs im Format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` sein. Sie dienen ausschliesslich der internen Referenzierung innerhalb der Datei (z.B. `account_id` in Planwerten) und werden **nicht** in die Datenbank uebernommen – die Datenbank vergibt immer neue UUIDs.
- **Leere Felder:** Felder mit leerem String (`""`) oder `null` werden wie weggelassene Felder behandelt und auf Datenbankstandards (i.d.R. leerer String) gesetzt.
- **Reihenfolge:** Konten werden rekursiv ueber `children` eingebettet; Elternkonten sind daher immer implizit vor ihren Kindern bekannt.
- **Revisionen:** Revisionen werden in der angegebenen Reihenfolge erstellt; die Reihenfolge bestimmt damit implizit die Erstellungszeit.
- **`is_container`:** Wird automatisch auf `true` gesetzt, wenn ein Konto Unterkonten hat, auch wenn das Feld `false` oder weggelassen ist.

## Export-Semantik

- Beim Export werden alle Konten verschachtelt ausgegeben (Wurzelkonten in `accounts`, Unterkonten im jeweiligen `children`-Array).
- Planwerte (`account_values`) werden pro Budget und pro Revision ausgegeben, auch wenn der Wert `0` ist, sofern ein Datenbankdatensatz existiert.
- `exported_at` wird auf den Zeitpunkt des Exports gesetzt (UTC, RFC 3339).
