# Sprint 18.16 – Projektcheck / Abgabecheck

## Ziel

Vor Bericht, PDF und Export soll der Anwender sofort sehen, ob der aktuelle Projektstand vollständig und plausibel ist.

## Neu

- Neuer zentraler Diagnose-Service: `src/diagnostics/ProjectDiagnostics.js`.
- Projektcheck auf Projekt- und Anlagenübersicht sichtbar.
- Ribbon-Schaltfläche **Projekt prüfen** ergänzt.
- Prüfung umfasst:
  - Projektnummer, Projektname, BKP-Nummer, Anlage, Bearbeiter und Firma
  - Vorhandene und berechenbare Teilstrecken
  - Fehlende Luftmengen / Geometrien
  - Hohe Luftgeschwindigkeit als Hinweis
  - Formteilzuordnung zu Teilstrecken
  - Sonderbauteil-Druckverluste
  - Berechnungs- und QS-Status
  - Bericht-Nr. und Revision
  - Speicherbarkeit als Projektdatei
- Projektcheck zeigt Fehler, Hinweise und OK-Punkte getrennt.
- Schnellaktionen im Check:
  - Neu prüfen
  - Projektangaben öffnen
  - Bericht öffnen

## Dateien

- `src/diagnostics/ProjectDiagnostics.js`
- `src/ui/components/WorkspaceComponent.js`
- `src/ui/core/RibbonActions.js`
- `src/ui/components/RibbonComponent.js`
- `src/ui/components/StatusBarComponent.js`
- `src/ui/ApplicationShell.css`
- `src/main.js`
- `index.html`
