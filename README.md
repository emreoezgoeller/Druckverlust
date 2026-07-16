# Druckverlust Pro

**Aktueller Stand:** Version 1.8.0 · Phase 31.00 · technischer Revisionsvergleich und internes Prüfprotokoll.

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
│   ├── revision/              technische Snapshots und Revisionsvergleich
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

## Phase 31.00

Der Bereich **Ausgabe → Abschluss** dokumentiert jetzt nicht nur den aktuellen Projektstand, sondern auch die fachlichen Änderungen gegenüber einem gewählten Revisionssnapshot:

- technische Detail-Snapshots für Teilstrecken, Formteile und Sonderbauteile,
- frei wählbare Basisrevision je Anlage,
- Erkennung hinzugefügter, entfernter und geänderter Elemente,
- Vergleich von Luftmenge, Dimension, Länge, Geschwindigkeit und Druckverlust,
- Filter und eigener CSV-Export für den Revisionsvergleich,
- Revisionsvergleich als optionale Seite im Professional Report,
- internes Prüfprotokoll mit sechs manuellen Kontrollpunkten, Prüfperson, Datum und Vermerk,
- persistente Speicherung in der `.dvp`-Projektdatei.

Ältere Revisionssnapshots aus Phase 30 bleiben lesbar. Für einen detaillierten Vergleich muss einmal ein neuer technischer Snapshot erstellt werden. Simulationsvarianten bleiben weiterhin nicht-destruktiv, bis ihre Werte ausdrücklich übernommen werden.

## Tests

Voraussetzung ist eine aktuelle Node.js-Version.

```bash
npm test
```

Gezielte Prüfung der neuen Phase:

```bash
npm run test:phase31
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

Projekt-, Varianten-, Revisions-, Autosicherungs-, Fachtest- und Feedbackdaten werden lokal im Browser oder in exportierten Dateien verarbeitet. Eine automatische Serverübermittlung ist nicht eingebaut.

## Dokumentation

- `docs/ARCHITEKTUR.md` – technische Struktur und Datenfluss
- `docs/CALCULATION_ENGINE.md` – Rechenkern
- `docs/DATENMODELL.md` – Projekt-, Varianten- und Revisionsdaten
- `docs/FORMTEILE.md` – Formteilbibliothek
- `docs/TESTPLAN.md` – aktive Qualitätssicherung
- `CHANGELOG.md` – Entwicklungshistorie
- `ROADMAP.md` – abgeschlossene und weitere Schritte
