# Testplan – Druckverlust Pro 2.1

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
6. Bericht für 5, 20 und mindestens 48 Teilstrecken prüfen.
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

