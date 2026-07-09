
## 18.12c – Bilderpfade und Bildschutz

- Report-Bilder werden auf GitHub Pages jetzt relativ zur Projektseite geladen, nicht mehr vom Domain-Root.
- Fehlerhafte 404-Aufrufe für `eo-logo.png`, `duct-network-hero.png` und Formteilbilder behoben.
- Cache-Busting auf `18.12c` erhöht.
- Bildschutz ergänzt: Drag, Rechtsklick und Markieren für Bilder/Skizzen werden blockiert.
- Für den Deploy-Fix werden die betroffenen Bilddateien zusätzlich in der Änderungs-ZIP mitgeliefert.

# CHANGELOG

## Phase 18.12b – Cache-/Deploy-Fix

- `index.html` lädt `ApplicationShell.css` und `src/main.js` neu mit Versionsparameter `?v=18.12b`.
- `src/pdf/report.js` verwendet keinen fehleranfälligen Named-Import von `calculateRow` mehr.
- Fallback-Berechnung im PDF-Modul ergänzt, damit alte Browser-/GitHub-Cache-Mischstände nicht mehr beim Start abbrechen.


## Phase 18.12a – Deploy-Fix

- Fehlenden Kompatibilitäts-Export in `src/calculation/engine.js` für GitHub-Pages-Deployment korrigiert.
- `calculateRow`, `fmt`, `calculateProject` und `createTest001State` werden wieder direkt bereitgestellt.
- Fehler behoben: `report.js` konnte `calculateRow` nicht importieren.

# Changelog


## 18.12 – Professionelle Startseite aktiv

- Phase-18-Oberfläche als aktive Startseite angebunden.
- `index.html` auf professionelle Shell umgestellt.
- `src/main.js` als Bootstrap für ApplicationState, Shell, Ribbon, Sidebar, Workspace, Properties und Statusbar neu aufgebaut.
- Standardprojekt mit 5 Teilstrecken beim Start ergänzt.
- Initiale automatische Berechnung beim Start ergänzt.
- Ribbon um `+ Sonderbauteil` erweitert.
- Basis-CSS für randlose Vollbild-Shell ergänzt.


## Sprint 18.11 – Arbeitsdashboard / Schnellaktionen

### Neu
- Arbeitsdashboard in Projektansicht ergänzt.
- Arbeitsdashboard in Anlagenansicht ergänzt.
- Schnellaktionen für `+ Teilstrecke`, `+ Formteil`, `+ Sonderbauteil` und `Bericht öffnen` ergänzt.
- Nächste-Schritte-Hinweise abhängig vom Projektzustand ergänzt.
- QS-Status, Gesamtdruckverlust, relevante Teilstrecken und Berichtsumfang im Dashboard sichtbar.

### Tests
- `tests/sprint18-workflow-dashboard.html`
- `tests/sprint18-workflow-dashboard.test.js`
