# Architektur – Druckverlust Pro

Stand: Version 2.7.0 · Phase 52.00

## 1. Ausführung

Druckverlust Pro ist eine statische Webanwendung ohne Build-Schritt und ohne Backend. HTML, CSS, JavaScript-Module und Medien werden über einen lokalen Webserver oder GitHub Pages ausgeliefert. Projektdaten bleiben lokal im Browser oder werden als `.dvp`, geprüftes `.dvpa`-Projektpaket, HTML, CSV beziehungsweise über den Browserdruck als PDF exportiert.

## 2. Einstiegspunkte

- `index.html` – Produkt- und Startseite
- `app.html` – Berechnungsanwendung
- `produkt.html` – kompatibler Weiterleitungs-Alias
- `release.json` – maschinenlesbarer Release- und Prüfumfang
- `beta.html`, `feedback.html` – Qualitätssicherung und lokale Rückmeldung
- `lizenz.html`, `impressum.html`, `datenschutz.html`, `404.html` – Begleitseiten

Der Anwendungseinstieg ist `src/main.js`.

## 3. Fachmodule

### Zustand und Projekte

- `src/app/ApplicationState.js` – zentraler Projekt- und UI-Zustand
- `src/app/ProjectCommands.js` – Änderungen an Projektobjekten
- `src/project/ProjectCalculationService.js` – Gesamtberechnung einer Anlage
- `src/project/defaultProject.js` – Standardprojekt

### Rechenkern

- `src/core/CalculationEngine.js` – Kanal-/Rohrberechnung, Verluste und Rundung
- `src/core/LookupEngine.js`, `InterpolationEngine.js` – Tabellenwerte
- `src/validation/ValidationEngine.js` – Eingabe- und Projektvalidierung
- `src/standards/SiaVelocityCompliance.js` – Raumnutzungen, Elektro-Vollaststunden sowie Geschwindigkeitsrichtwerte nach den bereitgestellten SIA-Auszügen
- `src/formteile/FormPartRegistry.js` und `src/formteile/calculators/` – 21 Formteiltypen

### Analyse, Simulation und Abschluss

- `src/quality/EngineeringQualityEngine.js` – neutrale Plausibilitätsprüfung
- `src/schematic/NetworkSchematicEngine.js` – SVG-Anlagenzeichnung und Analysemodi
- `src/simulation/LiveSimulationEngine.js` – nicht-destruktive Luftmengen-/Dimensionssimulation
- `src/closing/ProjectCompletionEngine.js` – Variantenarchiv, Fingerprints, Revisionssnapshots, Prüfprotokoll und Abschlussstatus
- `src/revision/RevisionComparisonEngine.js` – technische Snapshots sowie Detailvergleich von Teilstrecken und Bauteilen
- `src/safety/ProjectSafetyEngine.js` – gemeinsame Diagnose, lokale Sicherungshistorie, Prüfsumme und `.dvpa`-Projektarchive
- `src/handover/ProjectHandoverEngine.js` – Importvorschau, Übergabestatus, `.dvph`-Freigabepaket und Übergabeprotokoll

### Oberfläche

- `src/ui/ApplicationShell.js` – Grundlayout
- `src/ui/components/RibbonComponent.js` – Hauptnavigation
- `src/ui/components/SidebarComponent.js` – Projektbaum
- `src/ui/components/WorkspaceComponent.js` – Editoren, Bibliotheken, Analyse, Simulation und Abschluss
- `src/ui/components/StatusBarComponent.js` – Projekt- und Versionsstatus
- `src/ui/core/RibbonActions.js` – zentrale Aktionen
- `src/ui/core/UiTooltipController.js` – sofortige, zugängliche Infotexte für Symbolschaltflächen
- `src/ui/phase22_00.css` bis `src/ui/phase51_20.css` – additive, releasebezogene UI-Schichten

### Speicherung und Bericht

- `src/storage/StorageEngine.js` – `.dvp`-Serialisierung, Normalisierung und Migration
- `src/storage/AutoSaveEngine.js` – kurzfristige lokale Autosicherung
- `src/safety/ProjectSafetyEngine.js` – versionierte Sicherungsstände und portable Übergabepakete
- `src/report/ReportEngine.js` – einzig aktive HTML-/CSV-/PDF-Berichtengine

### Diagnose und Tests

- `src/diagnostics/` – Projekt-, Berechnungs-, Datei- und Deployment-Prüfungen
- `src/testing/` – Referenz-, Praxis-, Fachtest- und Beta-Module
- `tests/` – ausführbare Node- und Browserprüfungen

## 4. Datenfluss

```text
Benutzereingabe
   ↓
ApplicationState / ProjectCommands
   ↓
ValidationEngine
   ↓
ProjectCalculationService
   ↓
CalculationEngine + FormPartRegistry
   ↓
calculationResult (flüchtig, wird nicht in .dvp gespeichert)
   ├── EngineeringQualityEngine
   ├── NetworkSchematicEngine
   ├── LiveSimulationEngine
   ├── ProjectCompletionEngine
   ├── RevisionComparisonEngine
   ├── ProjectSafetyEngine
   ├── ProjectHandoverEngine
   └── ReportEngine
```

Varianten und Revisionen:

```text
Live-Simulation
   ↓ ausdrückliches Speichern
project.simulationVariants
   ↓ Auswahl
project.reportVariantId
   ↓
ReportEngine → Variantenvergleich

Aktueller Projektstand
   ↓ Revisionssnapshot
project.revisionSnapshots + report.revisionHistory
   ├── technische Snapshots → RevisionComparisonEngine
   ├── gewählte Basis → project.reportRevisionBaseId
   ├── manuelle Kontrolle → project.reviewProtocol
   ↓
Projektabschluss / Professional Report / CSV
```


Projektsicherheit:

```text
Aktueller Projektstand
   ├── kurzfristig → AutoSaveEngine
   ├── manuell/automatisch → localStorage-Sicherungshistorie (max. 8 Stände)
   └── Übergabe/Langzeitablage → ProjectSafetyEngine
                                  ↓
                         .dvpa-Projektpaket
                         ├── normale .dvp-Nutzdatei
                         ├── stabile Prüfsumme
                         ├── gemeinsame Diagnose
                         └── Abschluss-/Revisionsmetadaten

Wiederherstellung
   ↓ Notfallsicherung des aktuellen Stands
Prüfsumme und Schema validieren
   ↓
Projekt normalisieren, neu berechnen und als ungespeichert markieren
```


Projektübergabe:

```text
Eingehende .dvp / .dvpa / .dvph
   ↓ nicht-destruktive Importvorschau
Schema, Version, Prüfsumme, Berechnung und Objektanzahlen prüfen
   ↓ ausdrückliche Bestätigung
Notfallsicherung des aktuellen Projekts
   ↓
Geprüftes Projekt als ungespeicherten Arbeitsstand öffnen

Aktueller Projektstand
   ↓ Vorbereitung / Prüfung / Freigabe
project.handover.systems[systemId]
   ↓
ProjectHandoverEngine → .dvph-Freigabepaket + Übergabeprotokoll.csv
```

## 5. Persistenz

`StorageEngine` speichert alle fachlich relevanten Projektdaten, einschliesslich:

- Projektangaben und Einstellungen,
- Anlagen, Teilstrecken, Formteile und Sonderbauteile,
- Berichtsoptionen und Revisionshistorie,
- gespeicherte Simulationsvarianten,
- ausgewählte Berichtsvariante,
- Revisionssnapshots mit technischen Detaildaten,
- gewählte Basisrevision für den Bericht,
- manuelle Prüfprotokolle je Anlage.

Zusätzlich verwaltet `ProjectSafetyEngine` bis zu acht vollständige Sicherungsarchive im `localStorage` des aktuellen Browsers. Diese Historie ist browsergebunden und wird nicht in der `.dvp`-Datei verschachtelt. Exportierte `.dvpa`-Pakete sind portabel und enthalten eine normale `.dvp`-Dateihülle plus Diagnose- und Integritätsdaten.

Flüchtige Berechnungsergebnisse, Validierungsobjekte und Importinformationen werden vor dem Speichern entfernt und nach dem Öffnen neu erzeugt.

## 6. Fingerprints

`ProjectCompletionEngine` verwendet zwei getrennte Fingerprints:

- **Berechnungsfingerprint:** Einstellungen und Anlagengeometrie; prüft die Aktualität einer Variante.
- **Projektfingerprint:** zusätzlich Bericht-/Freigabedaten; prüft die Aktualität eines Revisionssnapshots.

Damit macht eine reine Revisionsänderung eine fachlich unveränderte Simulationsvariante nicht fälschlich veraltet. Phase 31 ergänzt den technischen Snapshot als strukturierte Vergleichsbasis; ältere Snapshots ohne Detaildaten bleiben lesbar.

## 7. Integrität und Wiederherstellung

Die Prüfsumme des Projektpakets wird über eine kanonische `.dvp`-Dateihülle gebildet; der wechselnde Exportzeitpunkt wird dabei ausgeklammert. Beim Öffnen eines `.dvpa`-Pakets werden Dateityp, Schema, eingebettete Projektdatei und Prüfsumme geprüft. Ein verändertes oder unvollständiges Paket wird abgewiesen. Vor dem Ersetzen des aktuell geöffneten Projekts wird automatisch eine lokale Notfallsicherung erzeugt.

## 8. Pfade und Produktgrenzen

Alle Laufzeitpfade sind relativ zum Projektstamm. Aktive Formteilmedien liegen kanonisch unter `assets/formteile/`.

Bewusst nicht vorhanden sind Ventilatorauslegung, SFP/Energieauswertung sowie Hersteller-, Produkt- oder Artikelnummerndatenbanken. Analyse, Simulation, Abschluss und Bericht bleiben herstellerneutral.


## Phase 50.00 – Formteil-Workflow

`FormPartWorkflowEngine` kapselt die reine Kontextauflösung, lokale Reihenfolge, Strangnavigation und Anschlussvorschläge. Der `ApplicationState` hält die Ziel-Teilstrecke des Pickers, während `ProjectCommands` Erstellung und Sortierung kontrolliert ausführt. Manuelle Formteilwerte werden im Workspace bei einer Umzuordnung nicht still überschrieben.
