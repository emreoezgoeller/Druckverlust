# Druckverlust Pro

**Aktueller Stand:** Version 1.12.0 · Phase 35.00 · Projektcockpit, projektweite QS-Matrix und Dokumentationsstatus.

Druckverlust Pro ist eine browserbasierte, herstellerneutrale Fachanwendung zur Berechnung und Dokumentation von Druckverlusten in Lüftungsanlagen. Enthalten sind Projekt- und Mehranlagenverwaltung, Projektcockpit, projektweiter Anlagenvergleich, Teilstrecken, 14 berechnete Formteiltypen, Sonderbauteile, automatische Neuberechnung, Engineering-QS, interaktive Anlagenzeichnung, Live-Simulation, gespeicherte Varianten, Revisionssnapshots, `.dvp`-Projektdateien, lokale Sicherungshistorie, geprüfte `.dvpa`-Projektarchive, kontrollierte `.dvph`-Übergabepakete, Autosicherung und ein mehrseitiger Professional Report.

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
│   ├── handover/              Importvorschau, Übergabestatus und `.dvph`-Freigabepaket
│   ├── landing/               Produktseiten
│   ├── licensing/             vorbereitete Lizenzlogik
│   ├── project/               Projekte, Anlagenmanager, Standard-, Demo- und Praxisprojekte
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

## Phase 35.00

Unter **Projekt → Cockpit** steht jetzt eine projektweite Qualitäts- und Risikomatrix zur Verfügung:

- Projekt-Score aus Engineering-QS und Dokumentationsvollständigkeit,
- priorisierte Feststellungen über alle Anlagen, Teilstrecken und Projektangaben,
- technische Anlagenmatrix mit Luftart, Luftmenge, Geschwindigkeit, Druckverlust und Engineering-Score,
- Prüfung auf doppelte Anlagenbezeichnungen und BKP-Nummern,
- Hinweise zu leeren Anlagen, fehlenden BKP-Angaben und nicht klassifizierten Luftarten,
- Dokumentationsstatus für Projektnummer, Projektname, Objekt, Bearbeiter, Firma, Berichtnummer und Revision,
- neutrale Luftartenübersicht ohne automatische Luftbilanz oder Addition zu einer gemeinsamen Druckverlustkette,
- Filter für kritische Punkte, Warnungen und Hinweise sowie direkte Navigation zur betroffenen Anlage oder Teilstrecke,
- projektweiter Cockpit-CSV-Export,
- zusätzliche Seite **Projektweite QS-Matrix** im Professional Report bei Mehranlagen-Projekten.

Die Auswertung bleibt vollständig herstellerneutral. Sie ist eine Plausibilitäts- und Dokumentationshilfe und ersetzt keine objektspezifische Norm-, Akustik- oder Fachplanung.

## Phase 34.00

Unter **Projekt → Anlagen** steht jetzt ein zentraler Anlagenmanager für Mehranlagen-Projekte zur Verfügung:

- neue Anlagen anlegen und bestehende Anlagen vollständig duplizieren,
- Anlagen in der Projektfolge verschieben oder – ausser der letzten verbleibenden Anlage – löschen,
- Anlagenname, BKP-Nummer, Luftart und Beschreibung zentral bearbeiten,
- Druckverlust, Einlassluftmenge, maximale Geschwindigkeit, Engineering-Score und Objektanzahlen aller Anlagen vergleichen,
- nach Reihenfolge, Name, Druckverlust, Geschwindigkeit oder Qualität sortieren,
- projektweiten Anlagenvergleich als CSV exportieren,
- alle Anlagen direkt aus der Sidebar öffnen,
- die aktive Anlage bei Wechsel und Bearbeitung zuverlässig neu berechnen,
- bei mehreren Anlagen automatisch eine projektweite Übersicht in den Professional Report aufnehmen.

Beim Duplizieren werden interne IDs und alle Zuordnungen zu Teilstrecken neu aufgebaut. Damit bleiben Formteile und Sonderbauteile vollständig innerhalb der kopierten Anlage und kollidieren nicht mit dem Ausgangssystem. Einanlagen-Projekte bleiben vollständig kompatibel und erhalten keine zusätzliche leere Berichtsseite.

## Phase 33.00

Unter **Ausgabe → Übergabe** steht jetzt ein kontrollierter Übergabe- und Importbereich zur Verfügung:

- `.dvp`-, `.dvpa`- und `.dvph`-Dateien werden zuerst als Vorschau gelesen, berechnet und diagnostiziert, ohne das aktuelle Projekt zu verändern,
- Projektname, Anlage, Revision, Objektanzahlen, Dateiversion, Schema, Prüfsumme und Normalisierungshinweise werden vor der Übernahme angezeigt,
- eingehende Dateien werden mit dem aktuell geöffneten Projekt verglichen,
- der aktuelle Stand wird vor einer bestätigten Übernahme lokal notgesichert,
- Verantwortlichkeiten für Vorbereitung, Prüfung und Freigabe werden je Anlage dokumentiert,
- die formelle Freigabe setzt einen aktuellen Revisionsstand und ein vollständig bestätigtes Prüfprotokoll voraus,
- das neue `.dvph`-Freigabepaket enthält die bearbeitbare Projektdatei, Diagnose, Revisionen, Varianten, Freigabeangaben und Integritätsprüfsummen,
- beschädigte oder nachträglich veränderte Übergabepakete werden abgewiesen,
- ein separates Übergabeprotokoll kann als CSV exportiert werden,
- Freigabestatus und Verantwortlichkeiten erscheinen auf der Freigabeseite des Professional Reports und im Gesamt-CSV.

Das `.dvp`-Format bleibt das tägliche Bearbeitungsformat. `.dvpa` bleibt das Sicherheits- und Wiederherstellungsarchiv. `.dvph` ist der dokumentierte Übergabestand.

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
npm run test:phase35
```


```bash
npm run test:phase34
```

Die Gesamtsuite prüft unter anderem:

- feste Rechenreferenzen und Rundung,
- alle 14 Formteiltypen und Excel-Referenzpunkte,
- Grössen- und Anschluss-Synchronisation,
- Handrechnungen und Summenbildung,
- ein Praxisprojekt mit 48 Teilstrecken,
- Mehranlagen-Verwaltung, ID-Remapping und aktive Anlagenberechnung,
- projektweiter Anlagenvergleich in Oberfläche, CSV und Professional Report,
- Anlagenzeichnung, Analysemodi und PDF-Anlagenschema,
- Live-Simulation und gespeicherte Varianten,
- Projektabschluss, technische Revisionssnapshots und frei wählbare Vergleichsbasis,
- Projektsicherheit, lokale Sicherungshistorie und Wiederherstellung,
- `.dvpa`-Archiv-Roundtrip, stabile Prüfsumme und Manipulationserkennung,
- Importvorschau und Vergleich für `.dvp`, `.dvpa` und `.dvph`,
- `.dvph`-Freigabepaket, Übergabeprotokoll und Manipulationserkennung,
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
