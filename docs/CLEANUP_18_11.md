# Cleanup 18.11 – Übergabe nach Chat-Limit

## Bereinigt / repariert

- `.git` wird im bereinigten Übergabe-ZIP nicht mitgeliefert, damit der Stand schlank bleibt.
- Doppelte/fehlerhafte Lizenz-Datei im Unterordner `Druckverlust/` wird im Übergabe-ZIP entfernt. Massgebend bleibt die Lizenz im Projektstamm.
- `src/calculation/engine.js` wurde als Kompatibilitäts-Engine wiederhergestellt, damit `src/main.js` und `src/pdf/report.js` korrekt laden.
- `src/services/ProjectCalculationService.js` wurde als saubere Kompatibilitätsdatei auf den aktiven Service unter `src/project/ProjectCalculationService.js` korrigiert.
- `tests/project-calculation-service.test.js` wurde auf den korrekten relativen Import und die vorhandene TEST-001-Referenzdatei angepasst.
- `.gitignore` ergänzt, damit temporäre Dateien, Build-Ausgaben und ZIP-Exporte künftig nicht versehentlich im Projekt landen.
- Fallback auf fehlerhaft encodierte Sattelstück-Dateinamen entfernt.

## Bewusst behalten

- `docs/` und `tests/` bleiben enthalten, weil sie den Entwicklungsstand der Phasen 16–18 dokumentieren.
- Die neuen Phase-18-Module unter `src/app`, `src/ui`, `src/project`, `src/report`, `src/storage`, `src/validation` bleiben enthalten. Sie sind für die weitere Professionalisierung wichtig, auch wenn die aktuelle `index.html` noch die einfache Startseite über `src/main.js` lädt.
- Formteilbilder und Excel-Referenzen bleiben grundsätzlich enthalten, weil mehrere Module noch unterschiedliche Bildpfade/Fallbacks verwenden.

## Hinweis für nächsten Schritt

Aktuell existieren zwei UI-Stränge:

1. **Aktive einfache Web-App**: `index.html` → `src/main.js` → `src/ui/styles.css`
2. **Professionelle Phase-18-Struktur**: `ApplicationShell`, `WorkspaceComponent`, `ProjectCommands`, `ReportEngine` usw.

Für Phase 18.12 sollte entschieden werden, ob die `index.html` auf die professionelle Oberfläche umgestellt wird oder ob die einfache Oberfläche zuerst weiter stabilisiert wird.

## Nachtrag 18.11a – Projektangaben

- UI-Beschriftung angepasst: `Projektname` → `Projektnummer`, `Objekt` → `Projektname`, `Anlagennummer` → `BKP-Nummer`.
- Reihenfolge angepasst: `BKP-Nummer` steht vor `Anlage`.
- Bericht/CSV übernehmen dieselben Bezeichnungen.
