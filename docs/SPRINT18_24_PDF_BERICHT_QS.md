# Phase 18.24 – PDF-/Berichts-QS und Export-Feinschliff

## Ziel

Der Bericht soll vor PDF-, HTML- und CSV-Ausgabe klarer prüfen, ob die Ausgabe fachlich und technisch bereit ist.

## Ergänzt

- Exportprüfung erweitert um sichtbaren Dokumenttitel, geplante PDF-Seiten und aktive Inhaltsbereiche.
- Dateivorschau zeigt nun separat HTML-Bericht, PDF-/Druckname und CSV-Datenexport.
- Export-QS kann als Text kopiert werden.
- Zusätzliche Plausibilitätsprüfungen:
  - sichtbarer Berechnungsinhalt vorhanden
  - auffällige 0-Pa-Einträge
  - Formteil-Zuordnung
  - ausgeblendete leere Einträge
  - PDF-Seitenplan
  - HTML-Bild-Einbettung
- Exportbestätigung nutzt weiterhin dieselbe Prüfliste: Fehler sperren den Export, Hinweise verlangen Bestätigung.

## Geänderte Dateien

- `index.html`
- `CHANGELOG.md`
- `README.md`
- `ROADMAP.md`
- `src/core/appVersion.js`
- `src/main.js`
- `src/pdf/report.js`
- `src/report/ReportEngine.js`
- `src/ui/ApplicationShell.css`
- `src/ui/components/WorkspaceComponent.js`
- `docs/SPRINT18_24_PDF_BERICHT_QS.md`
