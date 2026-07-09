# CHANGELOG

## 18.18 – Versionszentrale und Update-QS

- Zentrale Versionsdatei `src/core/appVersion.js` ergänzt.
- Cache-Busting auf `18.18` erhöht.
- Statusbar, Hilfe, Info-Dialog und Deployment-QS verwenden jetzt dieselbe Versionsquelle.
- Neuer Ribbon-Button `Info` zeigt Version, Cache-Version, aktuelle Adresse und Projektumfang.
- `window.DruckverlustPro` enthält neu `version`, `label` und `info` für schnelle Browser-Konsole-Prüfung.
- Bericht-HTML nutzt die aktuelle Phase im Generator-Hinweis.

## 18.17 – Deployment-QS und finale Startdiagnose

- Neuer Ribbon-Button `Deploy prüfen` ergänzt.
- Neue Deployment-QS prüft GitHub-Pages-Pfad, Cache-Versionen, Pflichtmodule, Pflichtbilder und Startberechnung.
- Visuelle Deployment-QS-Seite mit OK-/Hinweis-/Fehlerzählung ergänzt.
- Zusammenfassung kann kopiert werden, damit Fehler beim Deployment einfacher weitergegeben werden können.
- Cache-Busting auf `18.17` erhöht: `index.html`, `src/main.js`, `WorkspaceComponent`, `ReportEngine` und PDF-Kompatibilitätsmodul.
- Statusbar zeigt Phase 18.17 an.


## 18.16 – Projektcheck / Abgabecheck

- Zentralen Diagnose-Service `ProjectDiagnostics` ergänzt.
- Projekt- und Anlagenübersicht zeigen jetzt einen Abgabe- und Plausibilitätscheck.
- Ribbon um `Projekt prüfen` erweitert.
- Prüfung umfasst Projektangaben, Teilstrecken, Formteile, Sonderbauteile, Berechnung, Berichtsdaten und Speicherbarkeit.
- Schnellaktionen im Check ergänzt: neu prüfen, Projektangaben öffnen und Bericht öffnen.
- Cache-Busting auf `18.16` erhöht.


## 18.15 – Autosicherung und Wiederherstellung

- Lokale Autosicherung im Browser ergänzt (`localStorage`).
- Ungespeicherte Änderungen werden automatisch gesichert.
- Beim erneuten Öffnen wird eine gefundene Autosicherung zur Wiederherstellung angeboten.
- Nach `Speichern`, `Neu` oder `Öffnen` wird die lokale Autosicherung sauber gelöscht.
- Warnhinweis beim Schliessen/Neuladen ergänzt, solange das Projekt ungespeicherte Änderungen enthält.
- Statusbar zeigt die letzte Autosicherung an.
- Cache-Busting auf `18.15` erhöht.

## 18.13 – Neu-Projekt und Bedienungs-QS

- Standardprojekt in `src/project/defaultProject.js` zentralisiert.
- App-Start und `Neu`-Button verwenden jetzt dieselbe Projektvorlage.
- `Neu` erstellt wieder automatisch 5 vorbereitete Teilstrecken.
- Vor `Neu` und `Öffnen` wird bei ungespeicherten Änderungen eine Sicherheitsabfrage angezeigt.
- Cache-Busting auf `18.13` erhöht.


## 18.12d – Logo im Ribbon und Eigenschaften ausgeblendet

- EO-Logo im oberen Ribbon direkt vor „Druckverlust Pro“ ergänzt.
- Eigenschaften-Seitenleiste in der Hauptoberfläche ausgeblendet, damit die Arbeitsfläche breiter und ruhiger wird.
- `PropertiesComponent` bleibt im Projekt erhalten und kann später wieder aktiviert werden, sobald die Detailbearbeitung dort genutzt wird.
- Cache-Busting auf `18.12d` erhöht.


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

## 18.14 – Tastaturkürzel und Kontextaktionen

- Zentrale Tastaturbedienung ergänzt.
- `Ctrl+S`, `Ctrl+O`, `Ctrl+N`, `Ctrl+Enter`, `Ctrl+B`/`Ctrl+P`, `Ctrl+D`, `Entf`, `Esc` und `Ctrl+Alt+↑/↓` unterstützt.
- Ausgewählte Teilstrecken, Formteile und Sonderbauteile können per Tastatur dupliziert, gelöscht und verschoben werden.
- Ribbon um Hilfe-Button für die Tastaturkürzel ergänzt.
- Statusbar zeigt die wichtigsten Kurzbefehle an.
- Cache-Busting auf `18.14` erhöht.
