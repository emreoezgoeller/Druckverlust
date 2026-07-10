# Sprint 18.32 – Projektdatei-QS und .dvp-Stabilisierung

## Ziel

Die Projektdatei soll robuster werden, damit Speichern, Öffnen und Weitergabe stabiler funktionieren. Dazu wurde das `.dvp`-Format erweitert und ein eigener Datei-QS ergänzt.

## Neu

- `.dvp`-Datei enthält jetzt:
  - `fileType`
  - `schemaVersion`
  - `appName`
  - `appVersion`
  - `appRelease`
  - `exportedAt`
  - Projektzusammenfassung
- Projektstruktur wird beim Speichern/Öffnen normalisiert:
  - Projektangaben
  - Berichtsdaten
  - Anlagen
  - Teilstrecken
  - Formteile
  - Sonderbauteile
  - IDs und Zuordnungen
- ältere Rohprojekt-JSON-Strukturen mit `systems` können geöffnet und in das neue Format überführt werden.
- Neuer Ribbon-Button **Datei-QS**.
- Datei-QS prüft:
  - Speichermöglichkeit
  - `.dvp`-Dateiname
  - Schema-Version
  - Projektumfang
  - eindeutige IDs
  - Formteil- und Sonderbauteil-Zuordnungen
  - grobe Dateigrösse
  - Import-Warnungen
- Datei-QS ist kopierbar.

## Hinweis

Wenn beim Öffnen einer älteren Datei automatische Korrekturen angezeigt werden, sollte das Projekt einmal neu gespeichert werden. Danach liegt die Datei im stabilisierten Format vor.
