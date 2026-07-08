# Sprint 18.4/18.6 – Sonderbauteile und Bauteilbibliothek

Dieser Sprint ergänzt die Projektbedienung um eine einfache Bauteilbibliothek für Sonderbauteile.

## Enthaltene Bauteiltypen

- Filter
- Schalldämpfer
- Volumenstromregler
- Brandschutzklappe
- Luftdurchlass / Gitter
- Lüftungsgerät / Monoblock
- Wettergitter / Lamellenhaube
- Freie Komponente

## Bedienung

In der Anlagenübersicht befindet sich der neue Bereich **Sonderbauteile / Bauteilbibliothek**.
Dort kann ein Bauteiltyp gewählt und als Sonderbauteil hinzugefügt werden.

Pro Sonderbauteil können folgende Werte bearbeitet werden:

- Name
- Bauteiltyp
- Kategorie
- Typ / Beschreibung
- Zugeordnete Teilstrecke oder Anlage
- Luftmenge
- Anzahl
- Druckverlust je Stück
- Hersteller
- Modell / Typ-Nr.
- Bemerkung / Datenblatt-Hinweis

Der Gesamtdruckverlust wird automatisch berechnet:

```text
Druckverlust gesamt = Anzahl × Druckverlust je Stück
```

Der resultierende Wert wird als `pressureLoss` gespeichert und bleibt damit mit bestehender Berechnung, Bericht und CSV-Export kompatibel.

## Ziel

Die Sonderbauteile können jetzt professionell gepflegt, dupliziert, gelöscht, sortiert und im Projektbaum nach Kategorien angezeigt werden.
