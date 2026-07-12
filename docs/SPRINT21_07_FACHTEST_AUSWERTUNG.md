# Phase 21.07 – Fachtest-Runde und Freigabeauswertung

## Ziel

Mehrere Rückmeldungen aus der öffentlichen Fachtest-Runde werden maschinenlesbar zusammengeführt. Dadurch entsteht aus einzelnen Protokollen eine nachvollziehbare Entscheidungsgrundlage für Freigabe, Nachbesserung oder Blockierung.

## Umsetzung

- JSON-Export im Fachtester-Protokoll
- Import mehrerer JSON-Protokolle
- lokale Speicherung der Auswertungsrunde
- Aggregation aller zehn manuellen Prüfpunkte
- Zusammenfassung der Empfehlungen
- Priorisierung von Fehlern, Auffälligkeiten und offenen Tests
- Text- und CSV-Ausgabe
- Zugriff über Rechen-QS, Hilfe und Fachtester-Protokoll

## Entscheidungslogik

- **Blockiert:** mindestens ein manueller Fehler, fehlgeschlagener Automatiktest oder Empfehlung „Nicht freigeben“
- **Nachtest erforderlich:** Empfehlung „Nachbesserung erforderlich“ oder offene Prüfpunkte
- **Mit Hinweisen prüfen:** Auffälligkeiten oder Empfehlung „Geeignet mit Hinweisen“
- **Freigabe vorbereitet:** vollständig, fehlerfrei und ohne Auffälligkeiten

Die Entscheidungshilfe ersetzt keine fachliche Verantwortung. Sie bündelt die dokumentierten Rückmeldungen und macht deren Grundlage sichtbar.

## Tests

`npm run test:feedback-round` prüft Import, Aggregation, Prioritäten, Statusableitung sowie Text-/CSV-Ausgabe. Der Test umfasst 16 Einzelprüfungen.
