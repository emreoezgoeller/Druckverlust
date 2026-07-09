# Sprint 18.12b – Cache-/Deploy-Fix

## Ziel

Die GitHub-Pages-Seite darf nicht mehr mit einem alten Browser-/GitHub-Cache-Mischstand abbrechen.

## Problem

Im Browser erschien weiterhin:

```text
The requested module '../calculation/engine.js' does not provide an export named 'calculateRow'
```

Das kann passieren, wenn `report.js` neu/alt gemischt geladen wird oder `engine.js` noch aus dem Cache kommt.

## Umsetzung

- `index.html` lädt CSS und Main-JavaScript mit Versionsparameter `?v=18.12b`.
- `src/pdf/report.js` nutzt `import * as Engine` statt Named-Imports.
- Für `fmt`, `calculateRow` und `calculateProject` sind Fallback-Funktionen enthalten.

## Wichtig beim Deploy

Nach dem Hochladen auf GitHub Pages einmal mit `Ctrl + F5` neu laden.
Falls der Fehler weiterhin sichtbar ist, wurde sehr wahrscheinlich nicht der richtige Ordner/Branch ersetzt.
