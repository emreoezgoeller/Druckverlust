# Druckverlust Pro – Architektur

## Grundsatz

Die Benutzeroberfläche darf nicht die Berechnungslogik enthalten. Alle Fachberechnungen laufen über zentrale, DOM-unabhängige Module.

## Aktiver Stand Phase 18.20

```text
index.html                         – Startdatei / Cache-Busting
src/main.js                        – Bootstrap der professionellen Oberfläche
src/core/appVersion.js             – zentrale Versionsdaten
src/app/ApplicationState.js        – Anwendungszustand
src/app/ProjectCommands.js         – Projektaktionen
src/project/defaultProject.js      – Standardprojekt mit 5 Teilstrecken
src/project/ProjectCalculationService.js – Berechnungsservice
src/core/CalculationEngine.js      – Kanal, Rohr, Druckverlust, Summen
src/formteile/FormPartRegistry.js  – aktive Formteilbibliothek
src/report/ReportEngine.js         – Bericht / Druckansicht / HTML / CSV
src/storage/AutoSaveEngine.js      – Autosicherung
src/storage/StorageEngine.js       – Projektdateien speichern/öffnen
src/diagnostics/*                  – Projektcheck und Deployment-QS
src/ui/*                           – professionelle Oberfläche
```

## Bewusst behaltene Kompatibilität

- `src/calculation/engine.js`
- `src/pdf/report.js`
- `src/formteile/library.js`
- `src/ui/components/PropertiesComponent.js`

Diese Dateien bleiben enthalten, damit ältere Export-/Diagnosepfade nicht abrupt brechen und spätere Funktionen wieder andocken können.


## Ergänzung Phase 18.20

Formteile können Grössen automatisch aus der zugeordneten Teilstrecke übernehmen. Die aktive Logik sitzt im `WorkspaceComponent` und bleibt manuell übersteuerbar.
