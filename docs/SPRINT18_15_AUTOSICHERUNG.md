# Sprint 18.15 – Autosicherung und Wiederherstellung

## Ziel

Die Web-App soll ungespeicherte Eingaben nicht verlieren, wenn der Browser neu geladen wird, GitHub Pages kurz hängt oder die Seite versehentlich geschlossen wird.

## Umsetzung

- Neue Datei `src/storage/AutoSaveEngine.js`.
- Speicherung ungespeicherter Projekte im Browser-`localStorage`.
- Automatische Sicherung nach Projektänderungen mit kurzer Verzögerung.
- Wiederherstellungsdialog beim Start, wenn eine gültige Autosicherung gefunden wird.
- Sicherungen werden nur für geänderte Projekte gehalten.
- Nach `Speichern`, `Neu` und `Öffnen` wird die Autosicherung gelöscht.
- `beforeunload`-Schutz warnt beim Verlassen der Seite, solange Änderungen ungespeichert sind.

## Bedienung

Wenn eine lokale Sicherung vorhanden ist, erscheint beim Start eine Abfrage. Wird sie bestätigt, lädt die App die gesicherte Projektversion. Wird sie abgelehnt, wird die Sicherung gelöscht und ein neues Standardprojekt gestartet.

## Hinweise

Die Autosicherung ist lokal im verwendeten Browser gespeichert. Sie ist kein Ersatz für die `.dvp`-Projektdatei, sondern eine Sicherheitsleine gegen versehentliches Verlieren von Eingaben.

## Geänderte Dateien

- `index.html`
- `CHANGELOG.md`
- `ROADMAP.md`
- `src/main.js`
- `src/storage/AutoSaveEngine.js`
- `src/ui/core/RibbonActions.js`
- `src/ui/components/StatusBarComponent.js`
