# Phase 21.08 – Fachliche Freigabeentscheidung und Korrekturplan

## Ziel

Die gebündelte Fachtest-Auswertung wird in eine nachvollziehbare formelle Freigabeentscheidung überführt. Offene Punkte werden als konkrete Korrektur- und Nachtestmassnahmen dokumentiert.

## Funktionen

- Automatischer Entscheidungsvorschlag aus der Fachtest-Runde
- Formelle Entscheidung: offen, freigegeben, mit Auflagen oder blockiert
- Freigebende Person, Datum, Zielversion und Freigabevermerk
- Priorisierte Massnahmen aus Fehlern, Hinweisen und offenen Prüfpunkten
- Status, Verantwortliche, Termin, Korrektur und Nachtest je Massnahme
- Lokale Speicherung im Browser
- Export als Text, JSON und CSV
- Direkter Aufruf über `app.html?freigabe=1`

## QS

- Browser-Test: `tests/phase21-release-decision.html`
- Node-Test: `npm run test:release-decision`
- 24 von 24 Einzelprüfungen bestanden
- Gesamte bestehende Testreihe weiterhin erfolgreich
