---
title: Externe Datenbank
weight: 1
---

Diese Variante eignet sich, wenn du bereits eine PostgreSQL-Datenbank betreibst (z.B. ein verwalteter Datenbankdienst oder eine zentrale Instanz).

## Voraussetzungen

- Eine erreichbare PostgreSQL-Datenbank (>= 14)
- Die Datenbankverbindungs-URL (`DB_URL`)

## Starten

Stelle sicher, dass die `.env`-Datei korrekt konfiguriert ist (siehe [Konfiguration](../#konfiguration)) und die Variable `DB_URL` gesetzt ist.

```bash
docker compose up -d
```

Beim ersten Start wird automatisch die Datenbankmigration ausgeführt (`app-migrate`), bevor die Anwendung startet.

## Dienste

| Dienst        | Beschreibung                          | Port  |
|---------------|---------------------------------------|-------|
| `app`         | VSFV-Anwendung                        | 3000  |
| `app-migrate` | Datenbankmigrationen (einmalig)       | -     |
| `html2pdf`    | PDF-Generierungsdienst (intern)       | -     |

## Aktualisieren

```bash
# Neues Image laden und Container neu starten
docker compose pull
docker compose up -d
```

Die Datenbankmigrationen werden bei jedem Start automatisch angewendet.

## Stoppen

```bash
docker compose down
```
