# Release Notes

**Release:** Version 3.0.2 · Phase 58.20  
**Datum:** 22.07.2026

## Neu in Phase 58.20

- Eigenständige `deployment.html` mit Live-Prüfung für Standort, GitHub-Pages-Pfad, HTTPS, Version, Cachekennung, Pflichtdateien und Integritätsmanifest.
- Zentrale `deployment-config.json` und `src/core/deploymentConfig.js` für den Repository-Pfad `/Druckverlust/`.
- Robuste GitHub-Pages-404-Seite mit korrekter Basisauflösung auch bei unbekannten Unterpfaden.
- `.nojekyll` ergänzt, damit alle Laufzeitordner unverändert ausgeliefert werden.
- Reproduzierbarer GitHub-Pages-Build über `tools/build-github-pages.mjs`.
- Statische Pfad-, Link-, Cache- und Metadatenprüfung über `tools/verify-deployment.mjs`.
- Startseite, Bedienungsanleitung, Qualitätseite, Webmanifest und Deployment-Diagnose miteinander verknüpft.
- Versions- und Cachekennung auf **3.0.2 / 58.20** aktualisiert.
- Rechenkern und Projektschema **1.3.0** bleiben unverändert.

## Neu in Phase 58.10

- Startseite um eine klare Kurzanleitung mit sieben Arbeitsschritten erweitert.
- Neue eigenständige `bedienungsanleitung.html` mit 14 Kapiteln, Suche, Inhaltsverzeichnis und Druckansicht.
- Bedienungsanleitung erklärt SIA-Raumnutzung, Betriebsart, Teilstrecken, Formteilzuordnung, Ergebnisansichten, Projektdateien, Bericht und Fehlerbehebung.
- Kontextbezogenes Hilfe-Center auf den aktuellen Workflow mit SIA-Konfiguration, Ergebnisdarstellung und 21 Formteiltypen aktualisiert.
- Direkter Link zur vollständigen Bedienungsanleitung im Hilfe-Center ergänzt.
- Startseitenangaben von 14 auf 21 geprüfte Formteiltypen korrigiert.
- Versions- und Cachekennung auf **3.0.1 / 58.10** aktualisiert.
- Bedienungsanleitung in Sitemap, Release-Paket und SHA-256-Integritätsmanifest aufgenommen.

## Druckverlust Pro 3.0 Final

Phase 58 schliesst die bisherige Entwicklungsreihe als stabilen, herstellerneutralen Finalstand ab. Berechnung, Teilstrecken, Formteile, SIA-Geschwindigkeitsprüfung, Projektdateien, Berichte und Anlagenübersichten bleiben vollständig kompatibel mit dem Release Candidate aus Phase 57.

## Neu in Phase 58.00

- Die bisherige **RC-Prüfung** wurde zur sichtbaren **Finalprüfung** weiterentwickelt.
- Die Finalprüfung verbindet anlagenweite Neuberechnung, Projekt-QS, Rechen-QS, Datei-QS, Bericht, Speicher-Roundtrip, Praxisreferenz, Performance und Deployment.
- Neue SHA-256-Integritätsprüfung für die kritischen Finaldateien.
- Maschinenlesbares `release-integrity.json` mit Dateigrösse und Prüfsumme aller Dateien des sauberen Laufzeitpakets.
- Dokumentierte Windows-Druckabnahme für Google Chrome und Microsoft Edge direkt in der Anwendung.
- Browserbestätigungen werden lokal gespeichert und im Finalprotokoll ausgewiesen.
- Sauberes Laufzeitpaket ohne Tests, GitHub-Vorlagen, interne Entwicklungsdokumentation und temporäre Prüfdateien.
- Versions-, Cache-, Startseiten-, Rechtstext-, Manifest- und Projekthüllenangaben auf **3.0.0 / 58.00** vereinheitlicht.
- Vollständige Phase-58- und Regressionstestkette sowie erneute Patch- und Paketprüfung.

## Fachlicher Umfang

- teil­streckenbezogene Rauigkeit und automatische Darcy-Reibungszahl,
- Rechteckkanäle und Rundrohre,
- 21 herstellerneutrale Formteiltypen,
- sechs zusätzliche Krümmerabzweige beziehungsweise Krümmerendstücke,
- freier ζ-Wert,
- SIA-Geschwindigkeitsprüfung nach Raumnutzung und Betriebsart,
- Standard- und Professional-Ergebnisdarstellung,
- drucksicherer A4-Bericht und mehrseitiges Anlagenschema,
- `.dvp`, `.dvpa` und `.dvph` mit Rückwärtskompatibilität und Migration.

## Windows-Finalabnahme

Die isolierte Linux-Prüfumgebung kann keine echte Windows-Installation von Chrome und Edge simulieren. Deshalb enthält Phase 58 einen nachvollziehbaren manuellen Final-Gate. Die Anwendung zeigt offen an, welcher Browser noch nicht bestätigt wurde. Die genaue Durchführung steht in `FINAL_ABNAHME_WINDOWS.md`.

## Testbefehle

```bash
npm run test:phase58
npm run test:phase57
npm run test:phase57:browser
npm test
npm run build:final
```

## Bewusst ausgeschlossen

- keine Ventilatorauslegung, Motorleistung, SFP-, Energie- oder Betriebskostenberechnung,
- keine Hersteller-, Produkt- oder Artikelnummerndatenbank.
