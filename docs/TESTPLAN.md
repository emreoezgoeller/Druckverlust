# Testplan – Druckverlust Pro 2.0

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
