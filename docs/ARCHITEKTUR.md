# Architektur – Druckverlust Pro

Stand: Version 1.3.12 · Phase 21.12

## 1. Ausführung

Druckverlust Pro ist eine statische Webanwendung ohne Build-Schritt und ohne Server-Backend. HTML, CSS, JavaScript-Module und Medien werden direkt über einen Webserver oder GitHub Pages ausgeliefert. Projekt- und Prüfdaten bleiben lokal im Browser oder werden als Dateien exportiert.

## 2. Einstiegspunkte

- `index.html` – öffentliche Produktseite
- `produkt.html` – kompatibler Alias der Produktseite
- `app.html` – Berechnungsanwendung
- `beta.html` – Hinweise zum Beta-/Teststand
- `feedback.html` – lokales Feedbackformular
- `lizenz.html` – Lizenz- und Produktübersicht
- `impressum.html`, `datenschutz.html`, `404.html` – Begleitseiten

Das Tool startet über `src/main.js`.

## 3. Aktive Module

### Anwendung und Zustand

- `src/app/ApplicationState.js` – zentraler Projekt- und UI-Zustand
- `src/app/ProjectCommands.js` – Erstellen und Ändern von Projektelementen
- `src/main.js` – Start, URL-Modi, Komponenten und Autosicherung

### Rechenkern

- `src/core/CalculationEngine.js` – Kanal-/Rohrberechnung, Summen und Rundung
- `src/project/ProjectCalculationService.js` – Validierung und Projektberechnung
- `src/validation/ValidationEngine.js` – Eingabe- und Projektprüfung
- `src/core/LookupEngine.js`, `InterpolationEngine.js` – Tabellenwerte und Interpolation

### Formteile

- `src/formteile/FormPartRegistry.js` – zentrale Definition aller 14 Formteiltypen
- `src/formteile/calculators/` – fachliche Einzelrechner
- `src/formteile/formteile.manifest.json` – geprüfte Bild- und Excel-Referenzen
- `assets/formteile/` – flache, kanonische Ablage der aktiven PNG- und XLSX-Dateien

### Oberfläche

- `src/ui/ApplicationShell.js` – Grundlayout
- `src/ui/components/RibbonComponent.js` – Hauptaktionen
- `src/ui/components/SidebarComponent.js` – Projektbaum
- `src/ui/components/WorkspaceComponent.js` – Editoren, Dashboard, Hilfe und QS
- `src/ui/components/StatusBarComponent.js` – Status und Versionsanzeige
- `src/ui/core/RibbonActions.js` – Speichern, Öffnen, Berechnen und Export
- `src/ui/core/KeyboardShortcuts.js` – Tastaturbefehle

Die CSS-Dateien `phase21_00.css` bis `phase21_11.css` sind weiterhin aktiv. Sie bilden den über mehrere Funktionsstufen aufgebauten aktuellen Oberflächenstand und werden erst in der nächsten Designkonsolidierung zusammengeführt.

### Speicherung

- `src/storage/StorageEngine.js` – `.dvp`-Dateien und Migration
- `src/storage/AutoSaveEngine.js` – lokale Autosicherung

### Bericht

- `src/report/ReportEngine.js` – einzige aktive Bericht- und PDF-Engine
- `assets/report/duct-network-hero.png` – Berichtgrafik

### Diagnose und Tests

- `src/diagnostics/` – Projekt-, Berechnungs-, Datei-, Deployment- und Freigabeprüfungen
- `src/testing/` – aktive Referenz-, Praxis-, Fachtest- und Beta-Module
- `tests/` – aktuelle Browser- und Node-Testeinstiege

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
calculationResult im Projekt
   ↓
Workspace / Status / ReportEngine / StorageEngine
```

## 5. Projektdateien

Das interne Projektmodell enthält Projektangaben, Anlagen, Teilstrecken, Formteile, Sonderbauteile, Einstellungen und Berechnungsergebnisse. `StorageEngine` serialisiert die fachlich relevanten Daten in eine `.dvp`-Datei und stellt sie beim Öffnen wieder her.

## 6. Pfadkonzept

Alle aktiven Laufzeitpfade sind relativ zum Projektstamm. Formteilbilder und Excel-Referenzen liegen ausschliesslich in der flachen Struktur:

```text
assets/formteile/<formteil-id>.png
assets/formteile/<formteil-id>.xlsx
```

Damit existiert pro aktivem Medium nur eine kanonische Datei. Veraltete Unterordner- und Kompatibilitätspfade wurden in Phase 21.12 entfernt.

## 7. Bereinigungsgrundsätze

Im bereinigten Projekt verbleiben nur:

- aktive Laufzeitdateien,
- aktuelle Tests und Referenzen,
- öffentliche Seiten und Deployment-Dateien,
- notwendige Entwicklungs- und Projektdokumentation.

Git-Verlaufsdaten, alte Phasenlisten, historische Sprint-Einzeldokumente, doppelte Medien, nicht importierte Komponenten und frühere Bericht-/Rechen-Kompatibilitätsmodule sind nicht Bestandteil der Projekt-ZIP.
