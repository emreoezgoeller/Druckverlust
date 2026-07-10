# Phase 18.35 – Release Candidate / Schlussprüfung

## Ziel

Phase 18.35 bündelt die bisher aufgebauten QS-Funktionen zu einer finalen Schlussprüfung. Damit kann der aktuelle Stand vor einer internen Weitergabe an Tester oder Kollegen schnell bewertet werden.

## Neu

- Ribbon-Button **RC prüfen**.
- Neues Modul `src/diagnostics/ReleaseCandidateDiagnostics.js`.
- Eigene Detailseite im Arbeitsbereich für den Release-Candidate-Status.
- Kopierbares RC-Protokoll als Übergabe- oder Testnotiz.

## Geprüfte Bereiche

- Live-Berechnung des aktuellen Projekts.
- Projektcheck / Abgabecheck.
- Rechen-QS.
- Datei-QS für `.dvp`.
- Berichtmodell und PDF-Seitenplan.
- Demo-Projekt inkl. Berechnung.
- JSON-Speicherbarkeit.
- Ungespeicherte Änderungen.
- Deployment-QS inkl. Pflichtdateien, Cache-Version, UI und Bildschutz.

## Statuslogik

- **RC bereit**: keine Fehler und keine Hinweise.
- **RC mit Hinweisen**: intern nutzbar, gelbe Punkte vor externer Weitergabe prüfen.
- **RC blockiert**: rote Punkte zuerst korrigieren.

## Hinweis

Phase 18.35 ist als Abschluss der technischen Grundsystem-Stabilisierung gedacht. Danach kann Phase 19 mit Produktauftritt, Landingpage und Lizenz-/Abo-Vorbereitung starten.
