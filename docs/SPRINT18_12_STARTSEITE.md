# Sprint 18.12 – Professionelle Startseite aktiv

## Ziel
Die Phase-18-Oberfläche ist ab jetzt die aktive Hauptanwendung. Die bisherige einfache Oberfläche bleibt im Projekt als Legacy-Code vorhanden, wird aber nicht mehr von `index.html` geladen.

## Geändert
- `index.html` lädt jetzt `src/ui/ApplicationShell.css` und `src/main.js` für die professionelle Shell.
- `src/main.js` startet die Phase-18-Komponenten:
  - `ApplicationShell`
  - `RibbonComponent`
  - `SidebarComponent`
  - `WorkspaceComponent`
  - `PropertiesComponent`
  - `StatusBarComponent`
- Beim Start wird ein neues Standardprojekt mit 5 Teilstrecken erstellt.
- Die Projektansicht wird direkt geöffnet, damit Projektnummer, Projektname, BKP-Nummer und Anlage sofort bearbeitet werden können.
- Initiale Berechnung wird automatisch ausgeführt.
- Im Ribbon wurde `+ Sonderbauteil` ergänzt.
- Kleine CSS-Basis für `body` und `#app` ergänzt, damit die Shell ohne Browserrand startet.

## Bewusst nicht gelöscht
- `src/app.js`
- `src/ui/styles.css`
- ältere Tests und Legacy-Module

Diese Dateien bleiben vorerst als Rückfallebene/Referenz erhalten. Eine weitere Bereinigung kann in einer späteren Phase erfolgen, wenn die professionelle Oberfläche komplett freigegeben ist.

## Prüfung
- JavaScript-Syntax geprüft.
- Zentrale ES-Module importiert.
- Projektberechnung mit Standardprojekt geprüft.
