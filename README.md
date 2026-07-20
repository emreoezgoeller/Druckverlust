# Druckverlust Pro

**Aktueller Stand:** Version 2.6.0 · Phase 51.00 · einzeilige Plattformleiste mit vollständiger Symbolhilfe und robuster responsiver Oberfläche.

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
- Tool: `http://localhost:8000/app.html`
- Demo: `http://localhost:8000/app.html?demo=1`

## Kernfunktionen

- Rechteckkanäle und Rundrohre mit teil­streckenbezogener Rauigkeit k und automatisch berechneter Darcy-Reibungszahl λ,
- Dimensionierungsassistent mit Zielgeschwindigkeiten 2,0 / 3,0 / 4,0 m/s, freiem Zielwert und neutralen Standardabmessungen,
- Kanal- und Rohrabmessungen werden in der Oberfläche praxisnah in Millimeter geführt und intern weiterhin in Meter berechnet,
- Vorschläge verändern keine Eingabe, bevor eine Abmessung ausdrücklich übernommen wird,
- Schnellfunktion für die nächste Teilstrecke mit gleicher Luftmenge, Geometrie und Rauigkeit,
- 15 herstellerneutrale Formteiltypen, darunter „Freier ζ-Wert“ mit `Δp = ζ × p_dyn`,
- neue Formteile werden automatisch der zuletzt erstellten Teilstrecke zugeordnet und bleiben manuell umstellbar,
- mehrere Anlagen pro Projekt, Excel-/CSV-/TSV-Schnellerfassung, Projekt-QS und Professional Report,
- `.dvp`, `.dvpa` und `.dvph` mit Importprüfung und Prüfsumme,
- einzeilige Plattformleiste mit sofortigen Infotexten, Symbol-/Statuslegende und überlaufsicherer Sidebar,
- Hilfe-Center, Projektverlauf, Revisionen, Aufgaben, Simulation und Übergabeprüfung.

## Projektstruktur

```text
Druckverlust/
├── index.html                 Produkt- und Startseite
├── app.html                   Berechnungstool
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

Gezielte Phase-51-Prüfung:

```bash
npm run test:phase51
```

Release-Kurzlauf:

```bash
npm run test:release
```

Der Release prüft unter anderem 48 Einzelprüfungen für den Oberflächen- und Ribbon-Abschluss, 54 Einzelprüfungen für die vereinfachte Teilstreckenerfassung, 39 feste Rechenreferenzen, 15 Formteiltypen, 56 Excel-Einzelprüfungen, Speicher-Roundtrips, 48 Teilstrecken im Praxisprojekt und einen Lastfall mit insgesamt 200 Teilstrecken.

## Bewusst ausgeschlossen

- keine Ventilatorauslegung, Motorleistung, SFP-, Energie- oder Betriebskostenberechnung,
- keine Hersteller-, Produkt- oder Artikelnummerndatenbank.

Weitere Angaben: `RELEASE_NOTES.md`, `docs/MIGRATION.md` und `docs/RELEASE_CHECKLIST.md`.
