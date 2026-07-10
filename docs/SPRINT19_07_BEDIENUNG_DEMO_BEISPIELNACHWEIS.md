# Phase 19.07 – Bedienung, Demo und Beispielnachweis

## Ziel

Die Produktseite und das Tool sollen neuen Nutzern schneller zeigen, wie Druckverlust Pro funktioniert und wie ein fertiger Bericht aussieht.

## Umsetzung

- Produktseite ergänzt um einen kompakten Bereich **Demo / Beispielnachweis**.
- Neuer Link **Beispielbericht ansehen** führt zu `app.html?demo=1&report=1`.
- `src/main.js` erkennt zusätzlich `report=1` / `bericht=1` und öffnet nach dem Start direkt den Bericht.
- Hilfeseite im Tool erweitert um:
  - Demo-Erklärung
  - Beispielwerte für Kanal, Rohr, Formteil und Sonderbauteil
  - Rechenverständnis für `Δp Kanal/Rohr`, `Δp Formteil` und Sonderbauteile
  - PDF-/Druckhinweise
- Fehlerhafte verschachtelte Hilfe-Aktionslogik bereinigt.
- Demo-Projekt mit klarerem Zweck und Berichtshinweis ergänzt.

## Ergebnis

Ein Nutzer kann von der Hauptseite aus direkt:

1. das Tool starten,
2. das Demo-Projekt laden,
3. den Beispielbericht ansehen,
4. oder die Anleitung öffnen.

Damit wird die Seite verständlicher, ohne die Hauptseite zu überladen.
