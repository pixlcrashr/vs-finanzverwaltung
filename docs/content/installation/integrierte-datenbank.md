---
title: Integrierte Datenbank
weight: 2
---

Diese Variante liefert eine PostgreSQL-Datenbank als Docker-Container mit. Die Daten werden in einem Docker-Volume persistiert.

## Starten

Stelle sicher, dass die `.env`-Datei korrekt konfiguriert ist (siehe [Konfiguration](../#konfiguration)). Eine `DB_URL` wird **nicht** benötigt -- sie wird automatisch auf die integrierte Datenbank gesetzt.

```bash
docker compose -f compose.yaml -f compose.db.yaml up -d
```

{{% callout type="info" %}}
Optional kann ein eigenes Datenbankpasswort über die Umgebungsvariable `DB_PASSWORD` in der `.env`-Datei gesetzt werden. Standardwert ist `postgres`.
{{% /callout %}}

## Dienste

| Dienst        | Beschreibung                          | Port  |
|---------------|---------------------------------------|-------|
| `app`         | VSFV-Anwendung                        | 3000  |
| `app-migrate` | Datenbankmigrationen (einmalig)       | -     |
| `html2pdf`    | PDF-Generierungsdienst (intern)       | -     |
| `db`          | PostgreSQL-Datenbank (intern)         | -     |

Die Datenbank ist nur über das interne `database`-Netzwerk erreichbar und nicht von außen zugänglich.

## Aktualisieren

```bash
docker compose -f compose.yaml -f compose.db.yaml pull
docker compose -f compose.yaml -f compose.db.yaml up -d
```

## Stoppen

```bash
# Container stoppen (Daten bleiben im Volume erhalten)
docker compose -f compose.yaml -f compose.db.yaml down

# Container UND Datenbank-Volume löschen (Achtung: Datenverlust!)
docker compose -f compose.yaml -f compose.db.yaml down -v
```

## Datensicherung

Die Datenbankdaten liegen im Docker-Volume `db-data`. Für ein Backup kann `pg_dump` verwendet werden:

```bash
docker compose -f compose.yaml -f compose.db.yaml exec db \
  pg_dump -U vsf vsf > backup.sql
```

Wiederherstellen:

```bash
docker compose -f compose.yaml -f compose.db.yaml exec -T db \
  psql -U vsf vsf < backup.sql
```
