# Sprint 18.13 – Neu-Projekt und Bedienungs-QS

## Ziel

Der Startzustand der professionellen Oberfläche soll identisch sein, egal ob die App frisch geladen oder über „Neu“ ein neues Projekt erstellt wird.

## Umsetzung

- Standardprojekt in `src/project/defaultProject.js` zentralisiert.
- App-Start verwendet denselben Default wie der Neu-Button.
- Neu-Button erstellt wieder 5 vorbereitete Teilstrecken.
- Neu-/Öffnen-Aktionen fragen bei ungespeicherten Änderungen nach, bevor Daten verworfen werden.
- Projektstatus wird nach Neu sauber als gespeichert markiert.
- Cache-Busting auf `18.13` erhöht.

## Nutzen

- Weniger doppelte Projektlogik.
- Keine leeren Neu-Projekte mehr ohne Teilstreckenvorlage.
- Weniger Risiko, versehentlich ungespeicherte Eingaben zu verlieren.
