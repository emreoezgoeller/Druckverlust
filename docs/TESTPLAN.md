# Testplan – Druckverlust Pro 2.10

## Automatischer Gesamtlauf

```bash
npm test
```

Der Lauf umfasst Release-Integration, Rückwärtskompatibilität, Lastprüfung, Tabellenimport, Hilfe, Verlauf, Struktur, Suche, Aufgaben, Workflow, Mehranlagen, Sicherheit, Übergabe, Revision, Simulation, Bericht, Engineering-QS, Anlagenschema, Referenzrechnungen, Formteile und Praxisprojekt.

## Release-Kurzlauf

```bash
npm run test:release
```

## Manuelle Abnahme

1. `Druckverlust_starten.bat` ausführen.
2. Startseite und Tool in Edge und Chrome öffnen.
3. Demo laden, ändern, speichern und erneut öffnen.
4. Excel-/CSV-Schnellerfassung mit gültigen und fehlerhaften Zeilen prüfen.
5. Anlagenschema, Simulation und Engineering-QS bedienen.
6. Bericht für 5, 20, 48 und mindestens 67 Teilstrecken prüfen; Inhaltsverzeichnis, Fortsetzungsseiten und Layoutstatus kontrollieren.
7. Alte `.dvp`-Datei öffnen, Hinweise kontrollieren und neu speichern.
8. `.dvpa`- und `.dvph`-Pakete exportieren und wieder importieren.

Browser-Testwrapper aus Phase 21 wurden im finalen Release entfernt. Die fachlichen Node-Runner und Referenzquellen bleiben erhalten.

## Phase 46

- Standard-Rauigkeit und individuelle Teilstreckenwerte prüfen.
- unterschiedliche λ-Werte für Rechteckkanal und Rundrohr prüfen.
- automatische Übernahme von k, Re und λ in zugeordnete Formteile prüfen.
- Migration alter Projekte und Excel-/CSV-Roundtrip prüfen.


## Phase 47

- Freien ζ-Wert eingeben und unverändert übernehmen.
- Zugeordnete Teilstrecke liefert den dynamischen Druck.
- Δp = ζ × p_dyn wird automatisch berechnet.
- Änderungen von Luftmenge, Dimension und ζ aktualisieren den Pa-Wert.
- Bericht, Formteilbibliothek, Excel-Referenz und Speicher-Roundtrip prüfen.
## Phase 51.20

- alle 45 Raumnutzungen und drei Betriebsarten prüfen,
- Elektro-Vollaststunden anhand ausgewählter Referenzzeilen kontrollieren,
- Tabelle-49-Grenzwerte bei 2’000, 4’000 und 8’000 h/a sowie Zwischenwerte prüfen,
- Tabelle-50-Faktoren 1:1 bis 1:10 und Zwischenwerte prüfen,
- Warnung ab 1:6 und Begrenzung oberhalb 1:10 prüfen,
- Rundrohr- und Rechteckkanalbewertung in Anlage und Teilstrecke prüfen,
- `.dvp`-Roundtrip, Bericht und bestehende Projekte ohne Auswahl prüfen.



## Phase 52.00

- Ergebnis-Cockpit trennt Reibungs-, Formteil-, Sonderbauteil- und Gesamtverlust.
- Kritische Teilstrecke wird aus dem höchsten Teilstreckenverlust bestimmt.
- Standard-/Profi-Ansicht bleibt über Browserspeicher erhalten.
- Technische Kennwerte sind in der Standardansicht einklappbar.
- Glossar erklärt Δp, λ, ζ, k und p_dyn.
- Responsive Darstellung und Tabellenstruktur werden statisch geprüft.


## Phase 53.00

Automatischer Lauf:

```bash
npm run test:phase53
```

Geprüft werden:

- weisses Deckblatt, Logo-Wasserzeichen und technischer Dokumentblock,
- gemeinsamer Seitenplan für Inhaltsverzeichnis, Kapitel und Fusszeilen,
- 67 Teilstrecken auf fünf lückenlosen Hauptnetzseiten,
- 210 Formteile auf kontrollierten Teilstreckenboxen,
- Fortsetzungsseiten für 45 Sonderbauteile, 31 Engineering-Feststellungen, 40 QS-Hinweise und 15 Katalogeinträge,
- vollständige letzte Datensätze ohne abgeschnittene Tabellenbereiche,
- automatische Prüfung auf vertikale und horizontale Überfüllung,
- A4-Druckregeln, Seitenumbrüche und Schutz kritischer Elemente gegen innere Umbrüche,
- Versions-, Cache-, Dokumentations- und Releaseintegration.

Zusätzlich wird ein 43-seitiger Stressbericht in PDF gerendert und anhand repräsentativer Seiten sowie des vollständigen PDF-Texts kontrolliert.


## Phase 54.00

Automatischer Lauf:

```bash
npm run test:phase54
```

Geprüft werden:

- fortlaufende F-/S-Referenzen für Formteile und Sonderbauteile,
- einheitliche SVG-Symbole und dynamische Symbollegende,
- eindeutige Bauteil-Zuordnung je Teilstrecke,
- adaptive Mehrseitenaufteilung bei langen oder bauteilreichen Anlagen,
- lückenlose Fortsetzungsbereiche und Abschnittsfortschritt,
- kontrollierter `+n`-Überlauf bei dichten Symbolgruppen,
- automatische Kollisionsprüfung für Karten, Symbolbahnen und Randbereiche,
- Einbindung in Seitenplan, Inhaltsverzeichnis, Standalone-Bericht und Release-Daten.


## Phase 55.00

Automatischer Lauf:

```bash
npm run test:phase55
```

Geprüft werden:

- aktuelles Schema 1.3.0 und stabiler Roundtrip ohne unnötige Migration,
- ältere 1.0-/1.1-/1.2-Projektdateien, rohe Projektobjekte und historische Wrapper,
- deutsche Alt-Feldnamen und Einzelanlagen auf Projektebene,
- Original-vor-Migration-Sicherung mit unverändertem Quelldateiinhalt,
- Ergänzung fehlender Rauigkeiten mit 0,15 mm,
- sichere Behandlung fehlender oder ungültiger SIA-Angaben,
- Umrechnung historischer Millimeter-Geometrien,
- Erhalt von Haupt-, Durchgangs-, Abzweig- und Sonderbauteilzuordnungen,
- kontrolliertes Lösen ungültiger Zuordnungen und Korrigieren doppelter IDs,
- verständliche Fehler bei leeren, beschädigten, fremden, unvollständigen und zu neuen Dateien,
- Datei-QS, Versions-, Cache-, Dokumentations- und Releaseintegration.


## Phase 56.00

Automatischer Büro- und Praxistest:

```bash
npm run test:phase56
```

Geprüft werden:

- kleine, mittlere und grosse Mehranlagenprojekte,
- insgesamt 7 Anlagen, 230 Teilstrecken, 360 Formteile und 58 Sonderbauteile,
- gemischte Rechteck-/Rundnetze und unterschiedliche Rauigkeiten,
- vollständige SIA-Konfiguration und Bewertung jeder Teilstrecke,
- Grossstrang mit mindestens 100 Teilstrecken und umfangreicher Bauteilkette,
- unabhängige Handrechnung für Reibung, ζ, Sonderbauteile und Gesamtsumme,
- Rauigkeitssensitivität, Summenaudit und NaN-/Infinity-Schutz,
- `.dvp`-Roundtrip mit erneuter Berechnung ohne Abweichung,
- Berichtmodell, Seitenplan, HTML- und CSV-Vollständigkeit,
- Performancebudgets für Berechnung, Bericht und Speichern/Öffnen.

A4-/Browserausgabe:

```bash
npm run test:phase56:browser
```

Der Test nutzt einen installierten Chrome-, Chromium- oder Edge-Browser. Ist in der Laufzeitumgebung kein headless Browser startfähig, wird die A4-PDF-Ausgabe mit dem verfügbaren Fallback-Renderer erzeugt und die Seitenzahl gegen den Berichtseitenplan geprüft. Für die finale Freigabe bleibt zusätzlich ein manueller Windows-Test in Chrome und Edge vorgesehen.

## Phase 57.00

- zentrale Versions- und Releasekonsistenz 2.12.0 / 57.00,
- einheitliche Cachekennung aller App-Assets und statisch versionierten Modulimporte,
- sichtbare und aktive RC-Prüfung im Ribbon,
- Neuberechnung sämtlicher Anlagen,
- anlagenweiter Projektcheck und Rechen-QS,
- Berichtmodell und Seitenplan für alle Anlagen,
- verlustfreier `.dvp`-Roundtrip mit Ergebnisvergleich,
- deterministischer Büro-Praxis-Smoketest,
- RC-Laufzeitbudget für Berechnung, Bericht und Datei,
- vollständiges RC-Protokoll,
- vollständige Regressionstestkette,
- A4-PDF-Prüfung sowie dokumentierter manueller Windows-Chrome-/Edge-Final-Gate.
