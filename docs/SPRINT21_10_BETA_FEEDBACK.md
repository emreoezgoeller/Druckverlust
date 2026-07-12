# Phase 21.10 – Beta-Feedback und Fehlererfassung

## Ziel

Einzelne Auffälligkeiten und Ideen sollen ohne vollständiges Fachtest-Protokoll strukturiert dokumentiert werden können. Die Lösung arbeitet weiterhin ohne Server oder Cloud.

## Umsetzung

- Öffentliche Erfassungsseite: `feedback.html`
- Direkter Tool-Aufruf: `app.html?feedback=1`
- Tool-Navigation: **Rechen-QS → Beta-Feedback**
- Datenmodell: `src/testing/BetaFeedbackReport.js`
- Lokale Zwischenspeicherung im Browser
- Export als TXT, JSON und CSV sowie Kopieren in die Zwischenablage
- Kategorien für Berechnung, Formteile, Bericht/PDF, Projektdatei, Bedienung, Stabilität, Wunsch und Sonstiges
- Prioritäten von Vorschlag bis blockierend
- Optionaler technischer Umgebungssnapshot

## Datenschutz

Die Rückmeldung wird nicht automatisch versendet. Tester müssen die exportierte Datei oder den kopierten Text über einen separat vereinbarten Kontaktweg weitergeben.

## Tests

- Node: `npm run test:beta-feedback`
- Browser: `tests/phase21-beta-feedback.html`
- Ergebnis: 18 von 18 Einzelprüfungen bestanden
