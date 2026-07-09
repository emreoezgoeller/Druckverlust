# Architektur

## Aktive Hauptanwendung ab Phase 18.20

```text
index.html
└─ src/main.js
   ├─ src/app/ApplicationState.js
   ├─ src/ui/ApplicationShell.js
   ├─ src/ui/components/*
   ├─ src/app/ProjectCommands.js
   ├─ src/project/ProjectCalculationService.js
   ├─ src/core/CalculationEngine.js
   ├─ src/formteile/FormPartRegistry.js
   ├─ src/report/ReportEngine.js
   ├─ src/storage/AutoSaveEngine.js
   └─ src/diagnostics/*
```

## Kompatibilitätsmodule

Diese Dateien bleiben bewusst erhalten, obwohl sie nicht der primäre Arbeitsstrang sind:

- `src/calculation/engine.js` – Kompatibilitäts-Engine für Deployment-QS / alten PDF-Pfad.
- `src/pdf/report.js` – alter PDF-Kompatibilitätspfad.
- `src/formteile/library.js` – Legacy-Formteildefinitionen für den PDF-Kompatibilitätspfad.
- `src/ui/components/PropertiesComponent.js` – aktuell ausgeblendet, später wieder für Detailbearbeitung nutzbar.

## Grundsatz

Die Oberfläche darf keine Fachlogik enthalten. Fachlogik gehört in zentrale Engines und Services.


## Ergänzung Phase 18.20

Formteile können Grössen automatisch aus der zugeordneten Teilstrecke übernehmen. Die aktive Logik sitzt im `WorkspaceComponent` und bleibt manuell übersteuerbar.
