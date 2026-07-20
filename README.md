# Druckverlust Pro

**Aktueller Stand:** Version 2.2.0 · Phase 47.00 · zusammengeführt, bereinigt und als vollständiger Release geprüft.

Druckverlust Pro ist eine browserbasierte, herstellerneutrale Fachanwendung zur Berechnung und Dokumentation von Druckverlusten in Lüftungsanlagen. Die Anwendung verbindet Mehranlagen-Projekte, Excel-/CSV-Schnellerfassung, Teilstrecken, 15 herstellerneutrale Formteiltypen, neutrale Sonderbauteile, Engineering-QS, Anlagenschema, Simulation, Aufgaben, Revisionen, Projektsicherheit und Professional Report in einem gemeinsamen Projektmodell.

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

- Rechteckkanäle und Rundrohre mit teil­streckenbezogener Rauigkeit k (Standard 0,15 mm), automatisch berechneter Reibungszahl λ sowie Reibungs-, Formteil- und Gesamtdruckverlust,
- 15 herstellerneutrale Formteiltypen mit Excel-Referenzwerten, darunter „Freier ζ-Wert“ mit automatischer Berechnung `Δp = ζ × p_dyn`,
- Sonderbauteile mit frei definierbarem Druckverlust,
- mehrere Anlagen pro Projekt, Projektcockpit und projektweite QS,
- Excel-/CSV-/TSV-Schnellerfassung mit Vorschau, Sicherung und Importnachweis,
- interaktive SVG-Anlagenzeichnung und mehrseitiges PDF-Schema,
- nicht-destruktive Live-Simulation und Variantenvergleich,
- Aufgaben, Suche, Abhängigkeiten, Verlauf, Revisionen und Prüfprotokoll,
- `.dvp`, `.dvpa` und `.dvph` mit Importprüfung und Prüfsumme,
- Professional Report als Druck-/PDF-/HTML-Ansicht sowie CSV-Exporte,
- Hilfe-Center und geführte Erste Schritte.

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
└── RELEASE_NOTES.md           Änderungen der Version 2.1
```

## Tests

```bash
npm test
```

Zusätzlicher Release-Kurzlauf:

```bash
npm run test:release
```

Der finale Release prüft unter anderem 39 feste Rechenreferenzen, 14 Formteiltypen, 56 Excel-Einzelprüfungen, Speicher-Roundtrips, 48 Teilstrecken im Praxisprojekt und einen Lastfall mit insgesamt 200 Teilstrecken.

## Bewusst ausgeschlossen

- keine Ventilatorauslegung, Motorleistung, SFP-, Energie- oder Betriebskostenberechnung,
- keine Hersteller-, Produkt- oder Artikelnummerndatenbank.

Weitere Angaben: `RELEASE_NOTES.md`, `docs/MIGRATION.md` und `docs/RELEASE_CHECKLIST.md`.
