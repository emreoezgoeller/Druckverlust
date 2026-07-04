# Druckverlust Pro – Datenmodell 0.3.3

## Ziel

Die Weboberfläche, der PDF-Bericht und die Berechnungslogik sollen künftig dieselben Daten verwenden. Dadurch vermeiden wir doppelte Formeln und unterschiedliche Ergebnisse.

## Projektstruktur intern

```text
Projekt
├── project      Projektdaten und Berechnungseinstellungen
├── rows         Teilstrecken, Rohre, Kanäle und Sonderbauteile
├── parts        zugeordnete Formteile mit ζ-Werten
└── specials     reserviert für spätere Herstellerdatenbank
```

## Teilstrecke / Row

```json
{
  "id": "ts1",
  "type": "duct | pipe | special",
  "ts": "TS1",
  "desc": "Rechteckkanal 450 × 450 mm",
  "q": 900,
  "b": 0.45,
  "h": 0.45,
  "d": 0,
  "l": 1.25,
  "pa": 0,
  "zetaSum": 0.33
}
```

## Formteil

```json
{
  "id": "part1",
  "rowId": "ts1",
  "formPartId": "kreis_bogen",
  "name": "Kreisförmiger Bogen / Krümmer",
  "zeta": 0.21,
  "values": { "R": 110, "d": 125, "alpha": 90 }
}
```

## Grundsatz

Die Haupttabelle darf künftig keine manuelle Σζ-Eingabe erzwingen. Σζ entsteht aus den zugeordneten Formteilen.
