# Sprint 18.12a – Deploy-Fix

## Problem

Beim Start der veröffentlichten GitHub-Pages-Version konnte der Browser abbrechen mit:

```text
Uncaught SyntaxError: The requested module '../calculation/engine.js' does not provide an export named 'calculateRow'
```

## Ursache

`src/pdf/report.js` erwartet aus `src/calculation/engine.js` die Exporte:

- `calculateProject`
- `calculateRow`
- `fmt`

In der bisherigen GitHub-Version war `src/calculation/engine.js` teilweise noch die alte Kompatibilitätsdatei, welche nur aus `CalculationEngine.js` re-exportiert hat. Dadurch fehlten `calculateRow` und `fmt`.

## Lösung

`src/calculation/engine.js` wurde als vollständige Kompatibilitäts-Engine mit folgenden Exporten bereitgestellt:

- `toNumber`
- `fmt`
- `calculateRow`
- `calculateProject`
- `createTest001State`
- `CALCULATION_ENGINE_VERSION`

Damit funktionieren alte einfache Oberfläche, PDF-Modul und Phase-18-Start wieder sauber zusammen.

## Wichtig für Deployment

Beim Hochladen auf GitHub muss diese Datei zwingend mitkopiert werden:

```text
src/calculation/engine.js
```

Falls der Fehler nach dem Hochladen weiterhin sichtbar ist, Browser-Cache leeren oder mit `Ctrl + F5` neu laden.
