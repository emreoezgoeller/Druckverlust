# Sprint 18.26 – Ergebnisdetails verdichten

## Ziel

Die Berechnungsergebnisse sollen schneller prüfbar sein. Kanal-/Rohrverluste, Formteilverluste und die Summe je Teilstrecke werden deshalb in der Oberfläche deutlicher zusammengeführt.

## Umsetzung

- Anlagenübersicht erhält einen neuen Block **Teilstrecken- und Formteilaufteilung**.
- Kritische Teilstrecke mit höchstem Druckverlust wird automatisch hervorgehoben.
- Tabelle zeigt je Teilstrecke:
  - Luftmenge
  - Geschwindigkeit
  - Kanal-/Rohr-Reibungsverlust
  - Formteilverlust
  - Summe Teilstrecke
  - Anteil am Systemtotal
- Teilstrecken-Editor zeigt neu kompakte Ergebnis-Karten:
  - Kanal/Rohr
  - Formteile
  - Summe TS
- Formteil-Editor zeigt neu kompakte Ergebnis-Karten:
  - dynamischer Druck
  - ζ / Berechnungsmodus
  - Δp Formteil
- Zugeordnete Formteile zeigen zusätzlich den verwendeten dynamischen Druck und die Kurzformel `ζ × p_dyn`.

## Nutzen

- Schnellere Kontrolle, wo der grösste Druckverlust entsteht.
- Weniger Missverständnisse zwischen Kanal-/Rohrverlust und Formteilverlust.
- Bessere Nachvollziehbarkeit bei Übergängen, Abzweigen und Direktverlusten.

## Geänderte Dateien

- `index.html`
- `CHANGELOG.md`
- `README.md`
- `ROADMAP.md`
- `docs/SPRINT18_26_ERGEBNISDETAILS.md`
- `src/core/appVersion.js`
- `src/main.js`
- `src/pdf/report.js`
- `src/ui/ApplicationShell.css`
- `src/ui/components/WorkspaceComponent.js`
