---
title: Installation
weight: 1
---

In diesem Abschnitt wird beschrieben, wie du VSFV in einer Produktionsumgebung mit Docker Compose installierst und betreibst.

VSFV bietet zwei Deployment-Varianten:

{{< cards >}}
  {{< card link="externe-datenbank" title="Externe Datenbank" icon="server" subtitle="Nutze eine bereits vorhandene PostgreSQL-Datenbank." >}}
  {{< card link="integrierte-datenbank" title="Integrierte Datenbank" icon="database" subtitle="PostgreSQL wird als Container mitgeliefert." >}}
{{< /cards >}}

## Voraussetzungen

- [Docker](https://docs.docker.com/get-docker/) (>= 20.10)
- [Docker Compose](https://docs.docker.com/compose/install/) (>= 2.0)
- Ein konfigurierter OAuth2/SSO-Provider (z.B. GitLab)

## Konfiguration

Erstelle eine `.env`-Datei im Projektverzeichnis mit folgenden Variablen:

```bash
# Pflichtangaben
AUTH_SECRET="ein-sicherer-zufaelliger-string"
GITLAB_CLIENT_ID="deine-oauth-client-id"
GITLAB_CLIENT_SECRET="dein-oauth-client-secret"
GITLAB_ISSUER="https://gitlab.example.com/oauth/authorize"
ORGANISATION_NAME="Deine Organisation"

# Optional: App-Version (Standard: latest)
VERSION="latest"
```

{{% details title="Nur bei externer Datenbank" %}}

Wenn du eine externe Datenbank verwendest, muss zusätzlich die `DB_URL` gesetzt werden:

```bash
DB_URL="postgresql://benutzer:passwort@host:5432/datenbankname"
```

{{% /details %}}

{{% details title="Nur bei integrierter Datenbank" %}}

Wenn du die integrierte Datenbank nutzt, kann optional ein Datenbankpasswort gesetzt werden:

```bash
# Optional (Standard: postgres)
DB_PASSWORD="ein-sicheres-passwort"
```

{{% /details %}}
