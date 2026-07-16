# Druckverlust Pro

**Aktueller Stand:** Version 1.9.0 · Phase 32.00 · Projektsicherheit, lokales Sicherungsarchiv und geprüftes Übergabepaket.

Druckverlust Pro ist eine browserbasierte, herstellerneutrale Fachanwendung zur Berechnung und Dokumentation von Druckverlusten in Lüftungsanlagen. Enthalten sind Projekt- und Anlagenverwaltung, Teilstrecken, 14 berechnete Formteiltypen, Sonderbauteile, automatische Neuberechnung, Engineering-QS, interaktive Anlagenzeichnung, Live-Simulation, gespeicherte Varianten, Revisionssnapshots, `.dvp`-Projektdateien, lokale Sicherungshistorie, geprüfte `.dvpa`-Projektpakete, Autosicherung und ein mehrseitiger Professional Report.

## Lokal starten

Die Anwendung verwendet JavaScript-Module und muss über einen Webserver geöffnet werden. Unter Windows genügt ein Doppelklick auf:

```text
Druckverlust_starten.bat
```

Der Starter öffnet zuerst die Produktseite `index.html`. Von dort wird das Berechnungstool über **Tool starten** geöffnet.

Alternativ:

```bash
python -m http.server 8000
```

Danach im Browser:

- Produktseite: `http://localhost:8000/`
- Berechnungstool: `http://localhost:8000/app.html`
- Demo-Projekt: `http://localhost:8000/app.html?demo=1`

`app.html` nicht direkt über `file://` öffnen, weil Browser lokale Modul- und Manifestzugriffe blockieren können.

## Projektstruktur

```text
Druckverlust/
├── index.html                 Produkt- und Startseite
├── app.html                   Berechnungstool
├── assets/                    Logo, Berichtgrafik und Formteilreferenzen
├── src/
│   ├── app/                   Anwendungszustand und Projektbefehle
│   ├── closing/               Variantenarchiv, Revisionen und Projektabschluss
│   ├── core/                  Rechenkern, Lookup und Version
│   ├── diagnostics/           Projekt-, Rechen- und Deployment-QS
│   ├── formteile/             Registry und 14 Formteilrechner
│   ├── landing/               Produktseiten
│   ├── licensing/             vorbereitete Lizenzlogik
│   ├── project/               Standard-, Demo- und Praxisprojekte
│   ├── quality/               herstellerneutrale Engineering-QS
│   ├── revision/              technische Snapshots und Revisionsvergleich
│   ├── report/                Bericht-, CSV- und PDF-Engine
│   ├── safety/                Projektarchiv, Sicherungshistorie und gemeinsame Diagnose
│   ├── schematic/             SVG-Anlagenzeichnung und Analysemodi
│   ├── simulation/            nicht-destruktive Live-Simulation
│   ├── storage/               `.dvp`, Autosicherung und Migration
│   ├── testing/               Referenz- und Freigabemodule
│   ├── ui/                    Oberfläche und Komponenten
│   └── validation/            Eingabe- und Projektvalidierung
├── tests/                     Node- und Browserprüfungen
└── docs/                      technische Dokumentation
```

## Phase 32.00

Unter **Projekt → Sicherung** steht jetzt ein eigener Bereich für Projektsicherheit und Wiederherstellung zur Verfügung:

- gemeinsame Diagnose von Projektdatei, Projektstruktur und Berechnung,
- Sicherheits-Score mit Fehlern, Hinweisen und bestandenen Prüfpunkten,
- bis zu acht lokale Sicherungsstände im aktuellen Browser,
- automatische Sicherheitssicherung vor neuem Projekt, Demo, Öffnen und manuellem Dateiexport,
- Notfallsicherung vor jeder Wiederherstellung,
- Wiederherstellen, einzeln exportieren oder löschen lokaler Stände,
- portables `.dvpa`-Projektpaket mit normaler `.dvp`-Nutzdatei, Prüfsumme, Diagnose sowie Revisions- und Abschlussinformationen,
- Ablehnung beschädigter oder nachträglich veränderter Projektpakete,
- vollständiger Diagnoseexport als CSV.

Lokale Sicherungen sind browsergebunden und kein Ersatz für eine exportierte Projektdatei. Für Übergabe oder Langzeitablage ist das `.dvpa`-Projektpaket vorgesehen. Nach einer Wiederherstellung wird der Projektstand bewusst als ungespeichert markiert, damit er anschliessend kontrolliert als `.dvp` gespeichert wird.

## Tests

Voraussetzung ist eine aktuelle Node.js-Version.

```bash
npm test
```

Gezielte Prüfung der neuen Phase:

```bash
npm run test:phase32
```

Die Gesamtsuite prüft unter anderem:

- feste Rechenreferenzen und Rundung,
- alle 14 Formteiltypen und Excel-Referenzpunkte,
- Grössen- und Anschluss-Synchronisation,
- Handrechnungen und Summenbildung,
- ein Praxisprojekt mit 48 Teilstrecken,
- Anlagenzeichnung, Analysemodi und PDF-Anlagenschema,
- Live-Simulation und gespeicherte Varianten,
- Projektabschluss, technische Revisionssnapshots und frei wählbare Vergleichsbasis,
- Projektsicherheit, lokale Sicherungshistorie und Wiederherstellung,
- `.dvpa`-Archiv-Roundtrip, stabile Prüfsumme und Manipulationserkennung,
- detaillierter Revisionsvergleich im HTML-/PDF-Bericht und CSV-Export,
- internes manuelles Prüfprotokoll,
- `.dvp`-Speichern/Öffnen inklusive Phase-31-Daten,
- Fachtest-, Freigabe- und Beta-Workflows.

## Bewusste Produktgrenzen

Druckverlust Pro bleibt fachlich und visuell herstellerneutral. Nicht Bestandteil sind:

- Ventilatorauslegung, Motorleistung, SFP oder Energiekosten,
- Hersteller-, Produkt- oder Artikelnummerndatenbanken,
- automatische Marken- oder Produktempfehlungen.

Der Abschluss-Score und die Engineering-QS sind Plausibilitäts- und Dokumentationshilfen. Sie ersetzen keine objektspezifische fachliche Prüfung oder Freigabe.

## Daten und Datenschutz

Projekt-, Varianten-, Revisions-, Autosicherungs-, Sicherungshistorien-, Fachtest- und Feedbackdaten werden lokal im Browser oder in exportierten Dateien verarbeitet. Eine automatische Serverübermittlung ist nicht eingebaut.

## Dokumentation

- `docs/ARCHITEKTUR.md` – technische Struktur und Datenfluss
- `docs/CALCULATION_ENGINE.md` – Rechenkern
- `docs/DATENMODELL.md` – Projekt-, Varianten-, Revisions- und Archivdaten
- `docs/FORMTEILE.md` – Formteilbibliothek
- `docs/TESTPLAN.md` – aktive Qualitätssicherung
- `CHANGELOG.md` – Entwicklungshistorie
- `ROADMAP.md` – abgeschlossene und weitere Schritte
