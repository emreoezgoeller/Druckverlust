# Sprint 18.18 – Versionszentrale und Update-QS

## Ziel

Phase 18.18 bereinigt die bisherigen verstreuten Versionsnummern und macht die aktuelle App-Version zentral nutzbar. Damit werden GitHub-Pages-Deployments robuster, weil Cache-Version, Statusbar, Hilfe, Info-Dialog und Deployment-QS denselben Stand verwenden.

## Änderungen

- Neue zentrale Versionsdatei `src/core/appVersion.js` ergänzt.
- Cache-Busting auf `18.18` erhöht.
- Statusbar zeigt die Version nicht mehr als festen Text, sondern aus der zentralen Versionsdatei.
- Deployment-QS verwendet die zentrale Version für Pflichtdateien und Cache-Prüfung.
- Workspace-Deployment-Seite zeigt die aktuelle Version aus der zentralen Version.
- Neuer Ribbon-Button `Info` ergänzt.
- Der Info-Dialog zeigt:
  - App-Version / Phase
  - Cache-Version
  - aktuelle Adresse
  - aktuelles Projekt
  - aktive Anlage
  - Anzahl Teilstrecken, Formteile und Sonderbauteile
  - Hinweis zu GitHub Pages / Ctrl+F5
- Bericht-HTML erhält den Generator-Hinweis mit der aktuellen Phase.
- `window.DruckverlustPro` enthält neu `version`, `label` und `info` für einfache Browser-Konsole-Prüfung.

## Betroffene Dateien

- `index.html`
- `CHANGELOG.md`
- `README.md`
- `ROADMAP.md`
- `src/main.js`
- `src/core/appVersion.js`
- `src/diagnostics/DeploymentDiagnostics.js`
- `src/pdf/report.js`
- `src/report/ReportEngine.js`
- `src/ui/components/RibbonComponent.js`
- `src/ui/components/StatusBarComponent.js`
- `src/ui/components/WorkspaceComponent.js`
- `src/ui/core/RibbonActions.js`
