# Sprint 18.9 – Bibliothek Schnellzugriff

## Ziel

Die Formteil- und Sonderbauteilbibliothek soll bei wiederholter Nutzung schneller bedienbar sein.

## Umsetzung

- Zuletzt verwendete Formteile werden lokal im Browser gemerkt.
- Zuletzt verwendete Sonderbauteile werden lokal im Browser gemerkt.
- Die letzten Einträge erscheinen oberhalb der jeweiligen Bibliothek als Schnellzugriff.
- Der Schnellzugriff kann pro Bibliothek geleert werden.

## Speicherung

Die Daten werden lokal über `localStorage` gespeichert:

```text
druckverlust-pro-library-recent
```

Die Projektdatei `.dvp` bleibt davon unberührt.
