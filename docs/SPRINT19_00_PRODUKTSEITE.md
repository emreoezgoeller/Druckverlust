# Phase 19.00 – Produktseite / Landingpage

## Ziel

Phase 19 startet den Produktauftritt von Druckverlust Pro, ohne die bestehende Tool-Startseite zu zerstören.

## Umsetzung

Neu erstellt:

- `produkt.html`
- `src/landing/landing.css`

Die bisherige App bleibt unter `index.html` direkt erreichbar. Die neue Produktseite ist separat über `produkt.html` abrufbar.

## Inhalte der Produktseite

- Hero-Bereich mit Logo, Nutzenversprechen und Tool-Button
- Funktionsübersicht für Teilstrecken, Formteile, Sonderbauteile und QS
- Arbeitsablauf von Projektangaben bis Bericht
- Bericht-/Export-Abschnitt
- Bildschutz für Logo und Vorschaugrafiken

## Entscheidung

Die Produktseite wurde bewusst noch nicht als neue `index.html` gesetzt. So bleibt der aktuelle GitHub-Link zum Tool stabil. In einem späteren Schritt kann entschieden werden, ob:

1. `index.html` die Produktseite wird und das Tool auf `app.html` wandert, oder
2. `index.html` weiterhin direkt das Tool bleibt und `produkt.html` nur für Präsentation/Vertrieb genutzt wird.
