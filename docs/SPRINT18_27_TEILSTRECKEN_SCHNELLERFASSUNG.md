# Sprint 18.27 – Teilstrecken-Schnellerfassung

## Ziel

Die Teilstrecken sollen schneller bearbeitet werden können, ohne jede Teilstrecke einzeln öffnen zu müssen.

## Umsetzung

- Neue Schnellerfassung in der Anlagenübersicht.
- Direkte Bearbeitung von Typ, Luftmenge, Länge und Geometrie.
- Rechteckkanal: Breite/Höhe aktiv, Durchmesser deaktiviert.
- Rundrohr: Durchmesser aktiv, Breite/Höhe deaktiviert.
- Zugeordnete Formteile werden nach Änderungen automatisch synchronisiert.
- Manuell überschriebenen Formteilen bleibt der Schutz erhalten.
- Ergebniswerte Geschwindigkeit und Δp Teilstrecke werden in der Tabelle angezeigt.

## Geänderte Dateien

- `index.html`
- `CHANGELOG.md`
- `README.md`
- `ROADMAP.md`
- `src/core/appVersion.js`
- `src/main.js`
- `src/pdf/report.js`
- `src/ui/ApplicationShell.css`
- `src/ui/components/WorkspaceComponent.js`
- `docs/SPRINT18_27_TEILSTRECKEN_SCHNELLERFASSUNG.md`
