# Druckverlust Pro

**Aktueller Stand:** Version 1.7.0 · Phase 30.00 · Projektabschluss, Variantenarchiv und Revisionsstand.

Druckverlust Pro ist eine browserbasierte, herstellerneutrale Fachanwendung zur Berechnung und Dokumentation von Druckverlusten in Lüftungsanlagen. Enthalten sind Projekt- und Anlagenverwaltung, Teilstrecken, 14 berechnete Formteiltypen, Sonderbauteile, automatische Neuberechnung, Engineering-QS, interaktive Anlagenzeichnung, Live-Simulation, gespeicherte Varianten, Revisionssnapshots, `.dvp`-Projektdateien, Autosicherung und ein mehrseitiger Professional Report.

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
│   ├── report/                Bericht-, CSV- und PDF-Engine
│   ├── schematic/             SVG-Anlagenzeichnung und Analysemodi
│   ├── simulation/            nicht-destruktive Live-Simulation
│   ├── storage/               `.dvp`, Autosicherung und Migration
│   ├── testing/               Referenz- und Freigabemodule
│   ├── ui/                    Oberfläche und Komponenten
│   └── validation/            Eingabe- und Projektvalidierung
├── tests/                     Node- und Browserprüfungen
└── docs/                      technische Dokumentation
```

## Phase 30.00

Der neue Bereich **Ausgabe → Abschluss** bündelt den dokumentierten Projektstand:

- neutraler Abschluss-Score und klare Bereitschaftsprüfungen,
- automatische Revisionssnapshots mit Berechnungskennwerten,
- Revisionshistorie für den Bericht,
- gespeicherte Simulationsvarianten mit Name und Bemerkung,
- Auswahl einer Variante für den Professional Report,
- Erkennung veralteter Varianten oder Revisionsstände,
- Variantenvergleich im Bericht und CSV-Export.

Simulationsvarianten bleiben zunächst getrennt vom Projekt. Erst eine ausdrückliche Übernahme verändert die Teilstrecken.

## Tests

Voraussetzung ist eine aktuelle Node.js-Version.

```bash
npm test
```

Gezielte Prüfung der neuen Phase:

```bash
npm run test:phase30
```

Die Gesamtsuite prüft unter anderem:

- feste Rechenreferenzen und Rundung,
- alle 14 Formteiltypen und Excel-Referenzpunkte,
- Grössen- und Anschluss-Synchronisation,
- Handrechnungen und Summenbildung,
- ein Praxisprojekt mit 48 Teilstrecken,
- Anlagenzeichnung, Analysemodi und PDF-Anlagenschema,
- Live-Simulation und gespeicherte Varianten,
- Projektabschluss und Revisionssnapshots,
- Variantenvergleich im HTML-Bericht und CSV-Export,
- `.dvp`-Speichern/Öffnen inklusive Phase-30-Daten,
- Fachtest-, Freigabe- und Beta-Workflows.

## Bewusste Produktgrenzen

Druckverlust Pro bleibt fachlich und visuell herstellerneutral. Nicht Bestandteil sind:

- Ventilatorauslegung, Motorleistung, SFP oder Energiekosten,
- Hersteller-, Produkt- oder Artikelnummerndatenbanken,
- automatische Marken- oder Produktempfehlungen.

Der Abschluss-Score und die Engineering-QS sind Plausibilitäts- und Dokumentationshilfen. Sie ersetzen keine objektspezifische fachliche Prüfung oder Freigabe.

## Daten und Datenschutz

Projekt-, Varianten-, Revisions-, Autosicherungs-, Fachtest- und Feedbackdaten werden lokal im Browser oder in exportierten Dateien verarbeitet. Eine automatische Serverübermittlung ist nicht eingebaut.

## Dokumentation

- `docs/ARCHITEKTUR.md` – technische Struktur und Datenfluss
- `docs/CALCULATION_ENGINE.md` – Rechenkern
- `docs/DATENMODELL.md` – Projekt-, Varianten- und Revisionsdaten
- `docs/FORMTEILE.md` – Formteilbibliothek
- `docs/TESTPLAN.md` – aktive Qualitätssicherung
- `CHANGELOG.md` – Entwicklungshistorie
- `ROADMAP.md` – abgeschlossene und weitere Schritte
