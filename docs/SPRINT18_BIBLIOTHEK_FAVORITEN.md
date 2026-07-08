# Sprint 18.10 – Bibliothek Favoriten

## Ziel

Die Formteil- und Sonderbauteilbibliothek erhält zusätzlich zum Schnellzugriff „Zuletzt verwendet“ eine feste Favoritenliste.

## Funktionen

- Formteile können mit einem Stern als Favorit markiert werden.
- Sonderbauteile können mit einem Stern als Favorit markiert werden.
- Favoriten werden oberhalb von „Zuletzt verwendet“ angezeigt.
- Favoriten können pro Bibliothek geleert werden.
- Favoriten werden lokal im Browser gespeichert.

## Speicherung

Die Favoriten werden im Browser unter folgendem LocalStorage-Key gespeichert:

```text
druckverlust-pro-library-favorites
```

Die Projektdatei `.dvp` wird dadurch nicht verändert.

## Test

```text
tests/sprint18-library-favorites.html
```
