# VS-Finanzverwaltung

Finanzverwaltungssoftware für Verfasste Studierendenschaften.

## Features

- Haushaltsplanung
    - Integration von Doppelter Buchführung als Single Source of Truth (SSoT)
    - Zuordnung von SSoT-Buchungen zu Haushaltskonten und Anträgen, bzw. beschlossenen Geldern
    - Errechnung von Ist-Werten durch SSoT
    - Verschachtelte Haushaltskonten
    - Übersichtliche Darstellung des Haushaltsplans
    - Export des Haushaltsplans
- Antragsverwaltung
    - Vorlagenverwaltung für Anträge
    - Zuordnung von (Finanz-)Anträgen zu Haushaltskonten
- SSO/OAuth2 Authentifizierung
- Benutzer- und Rechteverwaltung

## Fastify Server

This app has a minimal [Fastify server](https://fastify.dev/) implementation. After running a full build, you can preview the build using the command:

```
npm run serve
```

Then visit [http://localhost:3000/](http://localhost:3000/)
