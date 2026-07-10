# Phase 18.25 – Druckverlust-Aufteilung und PDF-Nachweis

## Ziel

Die Druckverlustsummen im Bericht sollen eindeutig nachvollziehbar sein. Besonders die Spalte `Δp Kanal/Rohr` muss klar von Formteil- und Sonderbauteilverlusten getrennt werden.

## umgesetzt

- Gesamtzusammenfassung im Bericht um eine klare Druckverlust-Aufteilung ergänzt.
- Formel im Bericht ergänzt:
  - Kanal/Rohr-Reibungsverlust
  - Formteilverluste
  - Sonderbauteile
  - Gesamtdruckverlust
- Teilstrecken-Aufteilung ergänzt:
  - `Δp Kanal/Rohr`
  - `Formteile`
  - `Summe TS`
- Hinweis ergänzt, dass die Haupttabelle nur den Reibungsdruckverlust der Teilstrecke zeigt.
- Rundungsdifferenz wird im Bericht transparent angezeigt, falls vorhanden.
- Legacy-PDF-Modul ebenfalls korrigiert:
  - Haupttabelle zeigt `Δp Kanal/Rohr Pa` statt unscharfem `ΔP Pa`.
  - Der Tabellenwert entspricht nur dem Kanal-/Rohr-Reibungsverlust.
  - Auf der Gesamtseite wurde ein Hinweis zur Druckverlust-Aufteilung ergänzt.

## Wirkung

Der Bericht ist jetzt besser prüfbar. Es ist klar sichtbar, warum der Gesamtdruckverlust nicht direkt aus der Haupttabelle allein entsteht, sondern aus:

`Kanal/Rohr + Formteile + Sonderbauteile = Gesamtdruckverlust`
