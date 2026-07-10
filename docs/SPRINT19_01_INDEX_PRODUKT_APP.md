# Phase 19.01 – Produktseite als index.html / Tool unter app.html

## Ziel

GitHub Pages soll zuerst die Produkt-/Landingpage zeigen. Das Berechnungstool soll nicht mehr direkt beim Öffnen der Domain starten.

## Umsetzung

- `index.html` ist jetzt die Produkt-/Landingpage.
- Das bisherige Tool-HTML wurde nach `app.html` verschoben.
- Alle sichtbaren Buttons **Tool starten**, **Zum Tool** und Demo-Hinweise führen zu `app.html`.
- `produkt.html` bleibt als Alias erhalten, damit frühere Links weiterhin funktionieren.
- Cache-Busting wurde auf `19.01` erhöht.

## Ergebnis

Beim Aufruf von GitHub Pages erscheint zuerst der Produktauftritt. Das Berechnungstool wird bewusst über den Button gestartet.
