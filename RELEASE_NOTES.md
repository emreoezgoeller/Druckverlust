# Release Notes

**Release:** Version 2.12.0 · Phase 57.00  
**Datum:** 21.07.2026

## Neu in Phase 57.00

- Die technische **RC-Prüfung** ist wieder direkt über das Ribbon erreichbar.
- Der RC-Check berechnet nicht nur die aktive Anlage, sondern **alle Anlagen des Projekts** neu.
- Projektcheck und Rechen-QS werden anlagenweise zusammengeführt; blockierende Fehler bleiben eindeutig sichtbar.
- Der Professional Report wird für jede Anlage auf Modell, Titel, Inhalt und Seitenplan geprüft.
- Ein echter `.dvp`-Roundtrip kontrolliert Speichern, erneutes Öffnen und unveränderte Druckverlustresultate.
- Ein deterministisches Büro-Praxisprojekt dient als zusätzlicher Rechen-, Bericht- und Datei-Smoketest.
- Berechnung, Bericht und Projektdatei werden mit konservativen RC-Zeitbudgets bewertet.
- SIA-Raumnutzung und Betriebsart werden für sämtliche Anlagen auf Vollständigkeit geprüft.
- Das RC-Protokoll enthält Projektumfang, Dateischema, Berichtseiten und gemessene Laufzeiten.
- Sämtliche bestehenden statischen Modul- und App-Asset-Kennungen wurden auf den einheitlichen Cache-Stand `57.00` bereinigt; widersprüchliche parallele `release`-Querystrings wurden entfernt.
- Versionsangaben, Startseite, Qualitätsseite, Rechtstexte, Datenmodell und Release-Metadaten wurden auf Version 2.12.0 vereinheitlicht.

## Qualitätsstatus

- vollständige Phase-57-RC- und Cachekonsistenzprüfung,
- vollständige bestehende Regressionstestkette,
- JavaScript-Syntaxprüfung aller Runtime- und Testdateien,
- reproduzierbare A4-PDF-Prüfung mit 30 Seiten,
- Patch-Installation und ZIP-Strukturprüfung.

## Browser-Abnahme

Der automatisierte Chromium-Prozess kann in der isolierten Prüfcontainer-Laufzeit weiterhin nicht zuverlässig starten. Die 30-seitige A4-Ausgabe wird deshalb reproduzierbar mit dem vorhandenen PDF-Renderer geprüft. Die abschliessende manuelle Druckabnahme unter **Windows mit Chrome und Microsoft Edge** bleibt ein ausdrücklich dokumentierter Freigabepunkt für Phase 58.00.

## Testbefehle

```bash
npm run test:phase57
npm run test:phase57:browser
npm test
```

## Bewusst ausgeschlossen

- keine Ventilatorauslegung, Motorleistung, SFP-, Energie- oder Betriebskostenberechnung,
- keine Hersteller-, Produkt- oder Artikelnummerndatenbank.
