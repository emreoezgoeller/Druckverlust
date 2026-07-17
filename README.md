# Druckverlust Pro

**Aktueller Stand:** Version 1.17.0 · Phase 40.00 · Sitzungsbezogener Änderungsverlauf mit Rückgängig, Wiederholen und Wiederherstellungspunkten.

Druckverlust Pro ist eine browserbasierte, herstellerneutrale Fachanwendung zur Berechnung und Dokumentation von Druckverlusten in Lüftungsanlagen. Enthalten sind Projekt- und Mehranlagenverwaltung, Projektcockpit, Projektworkflow mit Prüfprofilen und Systemvorlagen, zentraler Projekt-Navigator mit Aufgaben und Favoriten, globale Projektsuche mit Querverweisen und Sprungmarken, Struktur- und Abhängigkeitsprüfung mit Änderungsfolgen, sitzungsbezogener Änderungsverlauf mit Rückgängig/Wiederholen, projektweiter Anlagenvergleich, Teilstrecken, 14 berechnete Formteiltypen, Sonderbauteile, automatische Neuberechnung, Engineering-QS, interaktive Anlagenzeichnung, Live-Simulation, gespeicherte Varianten, Revisionssnapshots, `.dvp`-Projektdateien, lokale Sicherungshistorie, geprüfte `.dvpa`-Projektarchive, kontrollierte `.dvph`-Übergabepakete, Autosicherung und ein mehrseitiger Professional Report.

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
│   ├── project/               Projekte, Anlagenmanager, Workflow, Aufgaben, Suche, Verlauf, Projektindex, Abhängigkeiten, Konfliktprüfung, Prüfprofile, Vorlagen sowie Demo- und Praxisprojekte
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

## Phase 40.00

Unter **Projekt → Verlauf** steht jetzt ein sitzungsbezogener Änderungsverlauf zur Verfügung:

- automatische Zusammenfassung zusammengehöriger Projektänderungen,
- Rückgängig und Wiederholen über Ribbon, Verlaufsansicht und Tastatur,
- Tastenkürzel `Ctrl + Z`, `Ctrl + Y` beziehungsweise `Ctrl + Shift + Z`,
- eigene Verlaufsansicht mit aktuellem Stand, älteren Ständen und Redo-Zweig,
- gezielte Wiederherstellung beliebiger Sitzungsstände,
- manuelle Kennzeichnung wichtiger Wiederherstellungspunkte,
- Filter für ältere, spätere und markierte Stände,
- Export des Sitzungsjournals als CSV,
- Schutz der nativen Rückgängig-Funktion innerhalb von Eingabefeldern,
- automatische Neuberechnung und Wiederherstellung der betroffenen Auswahl nach Undo/Redo,
- Begrenzung auf maximal 40 Projektstände, damit grosse Projekte kontrolliert im Arbeitsspeicher bleiben,
- Integration in Ribbon, Sidebar, Statusleiste und Aufgaben-Schnellzugriffe.

Der Änderungsverlauf gilt bewusst nur für die aktuelle Browser-Sitzung und wird nicht in der `.dvp`-Datei gespeichert. Für dauerhafte Sicherungen bleiben die bestehenden Projektdateien, Revisionsstände und Sicherungsarchive zuständig.

## Phase 39.00

Unter **Projekt → Struktur** steht jetzt eine zentrale Struktur- und Abhängigkeitsprüfung zur Verfügung:

- Projektgraph für Projekt, Anlagen, Teilstrecken, Formteile, Sonderbauteile, Aufgaben, Revisionen und Varianten,
- auswählbare Änderungsanalyse für jedes wesentliche Projektelement,
- Darstellung eingehender und ausgehender Beziehungen sowie des erweiterten Elementumfelds,
- neutrale Änderungsfolgen für Berechnung, Engineering-QS, Anlagenschema, Simulation, Bericht, Revision, Abschluss und Übergabe,
- Erkennung fehlender oder doppelter IDs, doppelter Teilstreckenbezeichnungen, ungültiger Zuordnungen und verwaister Aufgaben-, Revisions- oder Variantenbezüge,
- Struktur-Score mit kritischen Punkten, Warnungen und Hinweisen,
- direkte Navigation zum betroffenen Projekt-, Anlagen-, Teilstrecken- oder Bauteilelement,
- vollständige Struktur- und Konfliktanalyse als CSV-Export,
- eigene Seite **Struktur- und Abhängigkeitsprüfung** im Professional Report,
- Integration in Ribbon, Sidebar, Statusleiste, Aufgaben-Schnellzugriffe und Tastenkürzel `Ctrl + Shift + D`,
- responsive Darstellung für Desktop, Tablet und kleinere Bildschirme.

Die Änderungsanalyse zeigt technische Zusammenhänge und mögliche Folgeprüfungen. Sie verändert keine Projektdaten automatisch und ersetzt keine fachliche Freigabe.

## Phase 38.00

Unter **Projekt → Suche** steht jetzt ein globaler Projektindex für grosse Ein- und Mehranlagen-Projekte zur Verfügung:

- Volltextsuche über Projektangaben, Anlagen, Teilstrecken, Formteile, Sonderbauteile, Aufgaben, Revisionen und Varianten,
- gewichtete Trefferreihenfolge mit Vorrang für exakte Bezeichnungen und direkte Titelübereinstimmungen,
- Filter nach Kategorie und Anlage,
- Querverweise von Teilstrecken zu zugeordneten Formteilen, Sonderbauteilen und Aufgaben,
- direkter Sprung zum gefundenen Projekt-, Anlagen-, Teilstrecken- oder Bauteilelement,
- projektbezogene Sprungmarken für häufig verwendete Suchtreffer,
- projektbezogener Suchverlauf mit maximal acht Einträgen,
- vollständiger Projektindex als CSV-Export,
- Integration in Ribbon, Sidebar, Statusleiste, Aufgaben-Schnellzugriffe und Tastenkürzel `Ctrl + K`,
- responsive Darstellung für Desktop, Tablet und kleinere Bildschirme.

Die Suche arbeitet ausschliesslich mit den Daten der geöffneten Projektdatei. Es findet keine externe Übertragung oder Herstellerzuordnung statt.

## Phase 37.00

Unter **Projekt → Aufgaben** steht jetzt ein zentraler Projekt-Navigator für die tägliche Abarbeitung zur Verfügung:

- automatische Übernahme projektweiter QS-Feststellungen als priorisierte Aufgaben,
- manuelle Aufgaben mit Priorität, Fälligkeit, Bearbeiter sowie Anlagen- und Teilstreckenbezug,
- Statuswechsel zwischen Offen, In Bearbeitung und Erledigt,
- Filter nach Status, Kritikalität, Überfälligkeit und Aufgabenquelle,
- direkte Navigation zur betroffenen Anlage oder Teilstrecke,
- Schnellzugriffe zu den wichtigsten Projekt-, Prüf-, Simulations- und Ausgabebereichen,
- Favoriten für häufig verwendete Ansichten, Anlagen und Teilstrecken,
- Aufgaben- und Favoritenexport als CSV,
- optionale Seite **Projektaufgaben** im Professional Report,
- direkter Aufruf mit `Ctrl + Shift + T`.

Automatische Aufgaben beruhen auf der herstellerneutralen Projekt- und Engineering-QS. Die Aufgabenliste unterstützt Organisation und Nachverfolgung, ersetzt aber weder eine verbindliche Terminplanung noch die fachliche Projektfreigabe.

## Phase 36.00

Unter **Projekt → Workflow** steht jetzt ein herstellerneutraler Bereich für standardisierte Projektabläufe zur Verfügung:

- vordefinierte Prüfprofile für allgemeine Planung, Komfortbereiche und Technikbereiche,
- frei definierbares benutzerdefiniertes Prüfprofil mit Plausibilitätsgrenzen,
- neutrale Systemvorlagen für Zu-/Abluft, vollständige Lüftungsanlage und Umluft,
- Vorlagen ergänzen nur fehlende Luftarten und überschreiben keine bestehenden Anlagen,
- kontrollierte Massenbearbeitung für Luftmenge, Länge und Kanal- beziehungsweise Rohrdimension,
- Geltungsbereiche für alle Teilstrecken, nur Rechteckkanäle, nur Rundrohre oder eine Auswahl,
- verbindliche Vorschau mit Vorher-/Nachher-Werten vor der Übernahme,
- Schutz vor dem Übernehmen einer veralteten Vorschau nach zwischenzeitlichen Projektänderungen,
- automatische Sicherheitssicherung vor Vorlagen- und Massenänderungen,
- optionales Neunummerieren und vollständige Neuberechnung nach der Übernahme,
- projektweites Änderungsprotokoll mit Bearbeiter, Zeitstempel, Änderungstyp und technischem Detail,
- Änderungsprotokoll als CSV sowie Prüfprofil im Professional Report und im Gesamt-CSV.

Die Prüfprofile sind neutrale Projektvorgaben und keine allgemeingültigen Normgrenzen. Sie können projektspezifisch angepasst werden. Hersteller-, Produkt-, Ventilator-, Motorleistungs-, SFP- oder Energiedaten werden nicht ergänzt.

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
npm run test:phase36
```

Vorherige Projektcockpit-Prüfung:

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
