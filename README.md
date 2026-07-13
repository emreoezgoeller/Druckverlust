# Druckverlust Pro

**Aktueller Stand:** Version 1.3.12 · Phase 21.12 · bereinigter und geprüfter Projektstand.

Druckverlust Pro ist eine browserbasierte Fachanwendung zur Berechnung von Druckverlusten in Lüftungsanlagen. Enthalten sind Projekt- und Anlagenverwaltung, Teilstrecken, 14 berechnete Formteiltypen, Sonderbauteile, automatische Neuberechnung, Projektprüfung, Referenztests, `.dvp`-Projektdateien, Autosicherung sowie mehrseitige Berichte und PDF-Ausgabe.

## Start

Die Anwendung verwendet JavaScript-Module und muss über einen lokalen Webserver oder GitHub Pages gestartet werden. Unter Windows kann dazu ohne Installation direkt die mitgelieferte Datei `Druckverlust_starten.bat` doppelt angeklickt werden. Sie startet einen kleinen lokalen Webserver und öffnet das Tool automatisch im Browser.

Alternativ:

```bash
python -m http.server 8000
```

Danach im Browser öffnen:

- Produktseite: `http://localhost:8000/`
- Berechnungstool: `http://localhost:8000/app.html`
- Demo-Projekt: `http://localhost:8000/app.html?demo=1`

Ein direktes Öffnen von `app.html` über `file://` wird nicht empfohlen, weil Browser lokale Modul- und Dateizugriffe einschränken.

## Projektstruktur

```text
Druckverlust/
├── index.html                 Produkt- und Startseite
├── app.html                   Berechnungstool
├── beta.html                  Beta- und Testhinweise
├── feedback.html              lokales Feedbackformular
├── impressum.html             vorbereitete Rechtseite
├── datenschutz.html           vorbereitete Datenschutzseite
├── lizenz.html                Lizenz-/Produktübersicht
├── assets/
│   ├── formteile/             kanonische Bilder und Excel-Referenzen
│   ├── logo/                  EO-Logo
│   └── report/                Berichtgrafik
├── src/
│   ├── app/                   Anwendungszustand und Projektbefehle
│   ├── core/                  Rechenkern, Lookup und Version
│   ├── diagnostics/           Projekt-, Rechen- und Deployment-QS
│   ├── formteile/             Registry und Formteilrechner
│   ├── landing/               Gestaltung und Logik der öffentlichen Seiten
│   ├── licensing/             vorbereitete Lizenzlogik
│   ├── project/               Standard-, Demo- und Praxisprojekte
│   ├── report/                aktive Bericht- und PDF-Engine
│   ├── storage/               Speichern, Öffnen und Autosicherung
│   ├── testing/               aktive Referenz- und Freigabetests
│   ├── ui/                    Oberfläche und Komponenten
│   └── validation/            Eingabe- und Projektvalidierung
├── tests/                     aktive Browser- und Konsolentests
└── docs/                      aktuelle technische Dokumentation
```

`produkt.html` bleibt als kleiner Weiterleitungs-Alias erhalten, damit bereits verwendete Links weiterhin funktionieren, ohne eine zweite Kopie der Produktseite pflegen zu müssen.

## Tests

Voraussetzung ist eine aktuelle Node.js-Version.

```bash
npm test
```

Die Gesamtsuite prüft unter anderem:

- feste Rechenreferenzen und Rundung,
- alle 14 Formteiltypen und Excel-Referenzpunkte,
- Grössen- und Anschluss-Synchronisation,
- Handrechnungen und Summenbildung,
- ein Grossprojekt mit 48 Teilstrecken,
- Speichern/Öffnen und Berichtserstellung,
- Fachtest-, Freigabe- und Beta-Workflows.

Einzelne Testgruppen können über die in `package.json` definierten `npm run test:*`-Befehle gestartet werden.

## Daten und Datenschutz

Projekt-, Autosicherungs-, Fachtest- und Feedbackdaten werden lokal im Browser verarbeitet. Eine automatische Serverübermittlung ist im aktuellen Stand nicht eingebaut.

## Veröffentlichung

Das Projekt ist für relative Pfade und den Einsatz unter GitHub Pages vorbereitet. Vor der öffentlichen produktiven Nutzung müssen die Angaben in Impressum, Datenschutz und Lizenz abschliessend rechtlich geprüft und vervollständigt werden.

## Dokumentation

- `docs/ARCHITEKTUR.md` – aktuelle technische Struktur
- `docs/CALCULATION_ENGINE.md` – Rechenkern
- `docs/DATENMODELL.md` – Projekt- und Anlagendaten
- `docs/FORMTEILE.md` – Formteilbibliothek
- `docs/TESTPLAN.md` – aktive Qualitätssicherung
- `CHANGELOG.md` – Entwicklungshistorie
- `ROADMAP.md` – weitere Planung


## Lokal starten

Unter Windows `Druckverlust_starten.bat` doppelklicken. Der lokale Webserver öffnet zuerst `index.html`; von dort startet `app.html` über die Schaltfläche „Tool starten“. Weitere Hinweise stehen in `LOKAL_STARTEN.txt`.
