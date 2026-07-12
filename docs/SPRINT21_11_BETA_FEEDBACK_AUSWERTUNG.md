# Phase 21.11 – Beta-Feedback-Auswertung und Fehlerliste

## Ziel

Die in Phase 21.10 erzeugten JSON-Rückmeldungen werden zu einer lokalen, priorisierten Fehlerliste zusammengeführt. Dadurch lassen sich Rückmeldungen nicht nur erfassen, sondern nachvollziehbar bewerten und bearbeiten.

## Funktionen

- Import mehrerer einzelner Beta-Feedback-JSON-Dateien
- Import und Export kompletter Feedback-Auswertungen
- Zusammenführen gleicher Meldungs-IDs ohne Datenverlust
- Sortierung nach Priorität und Bearbeitungsstatus
- automatische Kennzeichnung möglicher Duplikate
- Filter nach Suchtext, Kategorie, Priorität und Status
- Triage je Rückmeldung:
  - Status
  - Prioritätskorrektur
  - Verantwortliche Person / Team
  - Zielversion
  - interne Notiz
- lokales Speichern im Browser
- Export als JSON und CSV
- kopierbarer Gesamtbericht und Issue-Text je Rückmeldung

## Aufruf

- `app.html?feedback-auswertung=1`
- **Rechen-QS → Feedback-Auswertung**
- Hilfe → **Beta-Feedback auswerten**

## Tests

- `npm run test:beta-feedback-inbox`
- `tests/phase21-beta-feedback-inbox.html`
- 29 Einzelprüfungen für Import, Priorisierung, Filter, Duplikate, Triage, Export und Speicher-Roundtrip

## Datenschutz

Die Auswertung wird ausschliesslich lokal im Browser gespeichert. Es findet kein automatischer Upload und kein Serverversand statt.
