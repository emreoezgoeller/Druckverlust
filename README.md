# Druckverlust Pro

**Aktueller Stand:** Version 3.0.2 · Phase 58.20 · Deployment- und Veröffentlichungsupdate mit GitHub-Pages-Build, öffentlicher Online-Prüfung, robuster 404-Pfadbehandlung und erneuertem SHA-256-Integritätsmanifest.

Druckverlust Pro ist eine browserbasierte, herstellerneutrale Fachanwendung zur Berechnung und Dokumentation von Druckverlusten in Lüftungsanlagen. Die Anwendung verbindet Mehranlagen-Projekte, Teilstrecken, Formteile, neutrale Sonderbauteile, Engineering-QS, Anlagenschema, Simulation und Professional Report in einem gemeinsamen Projektmodell.

## Lokal starten

Unter Windows:

```text
Druckverlust_starten.bat
```

Der Starter öffnet zuerst `index.html` über einen lokalen Webserver. Von dort wird das Tool mit **Tool starten** geöffnet. `app.html` nicht direkt über `file://` starten.

Alternativ:

```bash
python -m http.server 8000
```

- Produktseite: `http://localhost:8000/`
- Bedienungsanleitung: `http://localhost:8000/bedienungsanleitung.html`
- Tool: `http://localhost:8000/app.html`
- Demo: `http://localhost:8000/app.html?demo=1`


## GitHub Pages veröffentlichen

Deployment-Paket erzeugen:

```bash
node tools/build-github-pages.mjs
```

Statische Deployment-Prüfung ausführen:

```bash
node tools/verify-deployment.mjs dist/Druckverlust_Pro_3_0_2_GitHub_Pages
```

- Zieladresse: `https://emreoezgoeller.github.io/Druckverlust/`
- Online-Prüfung: `deployment.html`
- vollständige Anleitung: `DEPLOYMENT_GITHUB_PAGES.md`
- `.nojekyll` muss im Repository-Stamm erhalten bleiben.

## Kernfunktionen

- Rechteckkanäle und Rundrohre mit teil­streckenbezogener Rauigkeit k und automatisch berechneter Darcy-Reibungszahl λ,
- Dimensionierungsassistent mit Zielgeschwindigkeiten 2,0 / 3,0 / 4,0 m/s, freiem Zielwert und neutralen Standardabmessungen,
- Kanal- und Rohrabmessungen werden in der Oberfläche praxisnah in Millimeter geführt und intern weiterhin in Meter berechnet,
- Vorschläge verändern keine Eingabe, bevor eine Abmessung ausdrücklich übernommen wird,
- Schnellfunktion für die nächste Teilstrecke mit gleicher Luftmenge, Geometrie und Rauigkeit,
- 21 herstellerneutrale Formteiltypen, darunter „Freier ζ-Wert“, vier Krümmerabzweige und zwei Krümmerendstücke,
- SIA-Geschwindigkeitsprüfung mit Raumnutzung, Betriebsart, Elektro-Vollaststunden, interpolierten Rundrohr-Richtwerten und Reduktionsfaktor für Rechteckkanäle,
- neue Formteile werden automatisch der zuletzt erstellten Teilstrecke zugeordnet und bleiben manuell umstellbar,
- mehrere Anlagen pro Projekt, Excel-/CSV-/TSV-Schnellerfassung, Projekt-QS und Professional Report,
- drucksicherer A4-Bericht mit weissem Deckblatt, dezentem Logo-Wasserzeichen, dynamischem Inhaltsverzeichnis und kontrollierten Fortsetzungsseiten,
- mehrseitiges Anlagenschema mit Vektorsymbolen, F-/S-Referenzen, Bauteil-Zuordnung und automatischer Kollisionsprüfung,
- automatische Layoutprüfung vor dem Drucken erkennt vertikale oder horizontale Überfüllungen,
- `.dvp`, `.dvpa` und `.dvph` mit Importprüfung und Prüfsumme,
- ältere `.dvp`-Dateien werden auf Schema 1.3.0 migriert; vor der Migration wird eine unveränderte `Original-vor-Migration`-Sicherung erstellt,
- gültige Formteil- und Sonderbauteilzuordnungen bleiben beim Öffnen älterer Projekte erhalten,
- einzeilige Plattformleiste mit sofortigen Infotexten, Symbol-/Statuslegende und überlaufsicherer Sidebar,
- Hilfe-Center, vollständige Bedienungsanleitung, Projektverlauf, Revisionen, Aufgaben, Simulation und Übergabeprüfung.

## Projektstruktur

```text
Druckverlust/
├── index.html                 Produkt- und Startseite
├── app.html                   Berechnungstool
├── bedienungsanleitung.html   vollständige, durchsuchbare Bedienungsanleitung
├── deployment.html            öffentliche Pfad-, Versions- und Pflichtdateiprüfung
├── deployment-config.json     GitHub-Pages-Ziel und Repository-Pfad
├── .nojekyll                  deaktiviert Jekyll-Verarbeitung auf GitHub Pages
├── Druckverlust_starten.bat   Windows-Starter
├── release.json               maschinenlesbarer Release-Stand
├── assets/                    Logo, Berichtgrafik und Formteilreferenzen
├── src/                       Rechenkern, Projektmodule, UI und Berichte
├── tests/                     automatisierte Node-Prüfungen
├── docs/                      Architektur, Testplan, Migration und Releasecheck
└── RELEASE_NOTES.md           Änderungen der aktuellen Version
```

## Tests

```bash
npm test
```

Gezielter Büro- und Praxistest sowie A4-/Browserausgabe:

```bash
npm run test:phase56
npm run test:phase56:browser
```

Gezielte Prüfung der Projektdateien und Rückwärtskompatibilität:

```bash
npm run test:phase55
```

Gezielte Prüfung des Anlagenschemas und des PDF-Abschlusses:

```bash
npm run test:phase54
npm run test:phase53
```

Gezielte Prüfung der SIA- und Ergebnisfunktionen:

```bash
npm run test:phase51.20
npm run test:phase52
```

Gezielte Prüfung der sechs neuen Formteile:

```bash
npm run test:phase51.10
```

Finalprüfung und Release-Kurzlauf:

```bash
npm run test:phase58
npm run test:release
npm run build:final
node tools/build-github-pages.mjs
node tools/verify-deployment.mjs
```

Der Release prüft unter anderem 95 Phase-56-Büro- und Praxisprüfungen mit 7 Anlagen, 230 Teilstrecken, 360 Formteilen und 58 Sonderbauteilen, die Phase-55-Migrationstests, die Phase-54-Schematests, die Phase-53-Berichtstests, 252 Einzelprüfungen für die SIA-Geschwindigkeitsprüfung, 65 Einzelprüfungen für die sechs neuen Krümmerformteile, 48 Prüfungen für den Oberflächen- und Ribbon-Abschluss, 54 Prüfungen für die vereinfachte Teilstreckenerfassung, 39 feste Rechenreferenzen, 21 Formteiltypen, 25 Excel-Referenzfälle mit 81 Einzelprüfungen, 179 Synchronisationsprüfungen, Speicher-Roundtrips, 48 Teilstrecken im Praxisprojekt und einen Lastfall mit insgesamt 200 Teilstrecken.

## Bewusst ausgeschlossen

- keine Ventilatorauslegung, Motorleistung, SFP-, Energie- oder Betriebskostenberechnung,
- keine Hersteller-, Produkt- oder Artikelnummerndatenbank.

Weitere Angaben: `bedienungsanleitung.html`, `deployment.html`, `DEPLOYMENT_GITHUB_PAGES.md`, `RELEASE_NOTES.md`, `FINAL_ABNAHME_WINDOWS.md` und `release-integrity.json`.
