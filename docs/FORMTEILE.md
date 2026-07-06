# Formteilbibliothek

Stand Sprint 16.2: Die Formteilbibliothek arbeitet jetzt mit flexiblen Parameterdefinitionen. Parameter sind keine einfachen Strings mehr, sondern Metadaten-Objekte mit Typ, Label, Standardwert, Gruppierung, Einheit, Hilfetext und optionalen Auswahlwerten.

## Grundstruktur

```js
parameters: [
  {
    id: 'alpha',
    label: 'Winkel α [°]',
    type: 'select',
    options: [15, 30, 45, 60, 90],
    default: 90,
    group: 'Referenzwerte',
    locked: true
  }
]
```

## Unterstützte Feldtypen

- `number`: Zahlenfeld
- `select`: Dropdown mit erlaubten Werten aus `options`

## Kreisförmiger Bogen / Krümmer

Aktiv angebunden:

- ID: `kreis_bogen`
- Calculator: `calculateKreisBogen`
- Eingaben:
  - `R` Radius in mm
  - `d` Durchmesser in mm
  - `alpha` Winkel in Grad als Dropdown
- Ergebnis:
  - ζ-Wert
  - R/d
  - Tabellenwert R/d
  - Tabellenwert α

## Referenzwerte

Die Benutzer sollen Referenzwerte wie `alpha` nicht frei eintippen. Der aktuelle Stand pflegt die erlaubten Werte in der Registry. Der spätere Schritt ist der strukturierte Import bzw. Abgleich mit den Excel-Referenzen unter `assets/formteile/...`.

## Vorhandene Formteile

- Kreisförmiger Bogen / Krümmer
- Eckiger Kanalbogen
- Kanal-Bogen Winkel
- Übergang klein → gross
- Übergang gross → klein
- Etage 45°
- T-Abzweig Durchgang Variante 1
- T-Abzweig Durchgang Variante 2
- T-Abzweig Variante 1
- T-Abzweig Variante 2
- 90° T-Stück

## Nächster Schritt

Für jedes Formteil wird ein eigener Excel-Abgleich definiert:

```text
Eingabewerte → ζ aus Excel → ζ aus Web-App → bestanden/nicht bestanden
```

## Sprint 16.3 – Korrektur Bild, Excel-Hinweis und Live-Ergebnis

- Formteilbilder liegen unter `assets/formteile/<formteil-id>/<datei>.png`.
- Der Workspace versucht mehrere Bildpfade, damit alte und neue Ablagestrukturen funktionieren.
- Der Excel-Hinweis zeigt dem Benutzer nur noch eine verständliche Referenzinformation. Der technische Dateipfad bleibt intern.
- Beim Öffnen eines Formteils wird eine fehlende oder ungültige Teilstreckenzuordnung automatisch auf die erste vorhandene Teilstrecke gesetzt.
- Dynamischer Druck und Druckverlust Formteil werden live aus der zugewiesenen Teilstrecke berechnet. Eine globale Projektberechnung ist für die Anzeige nicht mehr zwingend nötig.
- `kreis_bogen` nutzt die Excel-Logik `XLOOKUP(..., match_mode = 1)`, also exakter oder nächst grösserer Tabellenwert.

