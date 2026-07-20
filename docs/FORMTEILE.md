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

- Formteilbilder liegen kanonisch unter `assets/formteile/<formteil-id>.png`; die zugehörigen Excel-Referenzen liegen unter `assets/formteile/<formteil-id>.xlsx`.
- Der Workspace versucht mehrere Bildpfade, damit alte und neue Ablagestrukturen funktionieren.
- Der Excel-Hinweis zeigt dem Benutzer nur noch eine verständliche Referenzinformation. Der technische Dateipfad bleibt intern.
- Beim Öffnen eines Formteils wird eine fehlende oder ungültige Teilstreckenzuordnung automatisch auf die erste vorhandene Teilstrecke gesetzt.
- Dynamischer Druck und Druckverlust Formteil werden live aus der zugewiesenen Teilstrecke berechnet. Eine globale Projektberechnung ist für die Anzeige nicht mehr zwingend nötig.
- `kreis_bogen` nutzt die Excel-Logik `XLOOKUP(..., match_mode = 1)`, also exakter oder nächst grösserer Tabellenwert.


## Hosenstück

Das Hosenstück verwendet die Tabellenlogik `ζA` bezogen auf `wA`.

Eingaben:
- Bauform: Kanal oder Rohr
- Hauptanschluss `A`, Luftmenge `W`, daraus Geschwindigkeit `w`
- Abzweig `AA`, Luftmenge `WA`, daraus Geschwindigkeit `wA`
- Winkel `α`

Berechnung:

```text
wA/w = Geschwindigkeit Abzweig / Geschwindigkeit Hauptanschluss
ζA = Tabellenwert(α, wA/w)
Δp = ζA × pdyn(wA)
```

Der Druckverlust wird als Direktdruckverlust geführt, weil der Tabellenwert auf `wA` bezogen ist und nicht auf die Geschwindigkeit der zugewiesenen Teilstrecke.

## Eckiger Kanalbogen

Aktiv angebunden ab Sprint 16.13:

- ID: `eckiger_bogen`
- Calculator: `calculateEckigerBogen`
- Eingaben:
  - `R` Radius in mm
  - `a` Breite in mm
  - `b` Höhe in mm
- Tabellenlogik:

```text
R/b = Radius / Höhe
a/b = Breite / Höhe
ζ = Tabellenwert(R/b, a/b)
```

Der Lookup verwendet exakt oder nächst grösserer Tabellenwert.

## Kanal-Bogen mit Winkel

Aktiv angebunden ab Sprint 16.13:

- ID: `kanal_bogen_winkel`
- Calculator: `calculateKanalBogenWinkel`
- Eingaben:
  - `alpha` Winkel in Grad als Dropdown
  - `a` Breite in mm
  - `b` Höhe in mm
- Tabellenlogik:

```text
a/b = Breite / Höhe
ζ = Tabellenwert(α, a/b)
```

Der Lookup verwendet exakt oder nächst grösserer Tabellenwert.

## Sprint 16.14 – Übergänge

### Übergang gross → klein

Eingaben:

- Winkel β [°]
- kleiner Querschnitt A1 [m²]
- grosser Querschnitt A2 [m²]

Berechnung:

- Verhältnis A1/A2
- ζ-Wert über Tabellenlogik aus β und A1/A2

### Übergang klein → gross

Eingaben:

- Winkel β [°]
- kleiner Querschnitt A1 [m²]
- grosser Querschnitt A2 [m²]

Berechnung:

- Verhältnis A1/A2
- ζ-Wert über Tabellenlogik aus β und A1/A2

### Ergebnisanzeige

Die Workspace-Ergebnisanzeige ist bewusst auf die praxisrelevanten Werte reduziert. Interne Tabellenwerte, Formeln und Lookup-Werte werden nicht mehr angezeigt.

## Sprint 16.15 – Übergänge mit Kanal-/Rohrgrössen

Bei den Übergängen werden A1 und A2 nicht mehr direkt als Fläche eingegeben. Der Benutzer wählt pro Anschluss die Bauform und trägt die Abmessungen ein.

### Kleiner Anschluss A1

- Bauform: Kanal oder Rohr
- Kanal: Breite/Höhe in mm
- Rohr: Durchmesser in mm
- A1 wird automatisch in m² berechnet

### Grosser Anschluss A2

- Bauform: Kanal oder Rohr
- Kanal: Breite/Höhe in mm
- Rohr: Durchmesser in mm
- A2 wird automatisch in m² berechnet

Damit sind auch Mischübergänge möglich, zum Beispiel Kanal → Rohr oder Rohr → Kanal.

### Übergang gross → klein

Beim Übergang gross → klein werden Winkel β und Kanalkante gemeinsam berücksichtigt, weil beide Ausführungsarten den ζ-Wert beeinflussen.

- Winkel β: klassische Übergangstabelle über β und A1/A2
- Kanalkante: Kantentabelle mit Auswahl 1–4

Kanalkanten:

```text
1 = scharfe Kante
2 = gebrochene Kante
3 = gerundete Kante
4 = glatte, gute Abrundung
```

Berechnung:

```text
ζ = Tabellenwert(β, A1/A2) + Tabellenwert(Kanalkante, A1/A2) × (1 - A1/A2)
```

## Sprint 16.18 – Etage 45°

Die Etage 45° ist jetzt rechenfähig.

Eingaben:

- Bauform: Rohr oder Kanal
- Länge `LE` in mm
- Bei Rohr: Durchmesser `d` in mm
- Bei Kanal: Breite `a` und Höhe `b` in mm

Berechnete Werte:

- Bezugsdurchmesser `d/dh`
- Verhältnis `LE/d(dh)`

Berechnung:

```text
ζ = Tabellenwert(LE/d(dh))
```

Wichtig: Die Excel-Referenz verwendet `XLOOKUP(..., match_mode = -1)`. Deshalb verwendet die App bei der Etage 45° exakt oder den nächst kleineren Tabellenwert.
## Sprint 16.22 – Abschluss-QS der Formteilbibliothek

Die Formteilbibliothek ist jetzt in der Oberfläche besser gegliedert. Die Auswahl des Formteiltyps wird im Workspace nach Kategorien gruppiert, damit die Liste bei vielen Formteilen übersichtlicher bleibt.

Zusätzlich gibt es einen Smoke-Test:

```text
tests/formpart-library-smoke.html
```

Der Test prüft:

- alle registrierten Formteile
- ob ein Calculator vorhanden ist
- ob eine Bildreferenz vorhanden ist
- ob die Berechnung mit Defaultwerten ein numerisches Ergebnis liefert
- ob Direktdruckverlust-Formteile einen numerischen Druckverlust liefern

Damit können spätere Erweiterungen schneller geprüft werden, ohne jedes Formteil manuell durchzuklicken.



## Sprint 16 Abschluss

Die Formteilbibliothek 2.0 ist abgeschlossen. Alle 21 Formteile besitzen aktive Calculatoren, flexible Parameterdefinitionen, Bildreferenzen und werden in der Projektberechnung berücksichtigt.

Ergänzt wurden ausserdem:

- automatische Berechnung nach Eingabeänderung
- QS-/Plausibilitätsstatus
- getrennte Aufteilung von Reibung, ζ-Verlusten, Direktverlusten und Sonderbauteilen
- Berechnungsprüfung mit Differenzkontrolle
- Abschluss-Test `tests/sprint16-final.html`

Details siehe `docs/SPRINT16_ABSCHLUSS.md`.


## Phase 51.10 – Krümmerabzweige und Krümmerendstücke

Die Bibliothek wurde um sechs rechteckige Formteile erweitert:

- Krümmerabzweig 1 – Abzweig
- Krümmerabzweig 1 – Durchgang
- Krümmerabzweig 2 – Abzweig (Zusammenfluss)
- Krümmerabzweig 2 – Durchgang (Zusammenfluss)
- Krümmerendstück 1
- Krümmerendstück 2 (Zusammenfluss)

### Anschlusslogik

Krümmerabzweige verwenden drei Teilstrecken:

- `A / W / w`: Hauptanschluss
- `AD / WD / wD`: gerader Anschluss
- `AA / WA / wA`: Krümmeranschluss

Krümmerendstücke verwenden den Hauptanschluss `A / W / w` und den Anschluss `AA / WA / wA`. Abmessungen und Luftmengen werden aus den zugeordneten Teilstrecken übernommen. Die Zuordnung kann im Formteil weiterhin manuell geändert werden.

### Tabellenlogik

Für die Krümmerabzweige muss die Kombination `AA/AD`, `AD/A` und `AA/A` exakt in der Excel-Tabelle vorhanden sein. Beim Geschwindigkeitsverhältnis `wA/w` beziehungsweise `wD/w` gilt die Excel-Regel **exakt oder nächst kleinerer Tabellenwert**.

Krümmerendstück 1 verlangt zusätzlich ein hinterlegtes Seitenverhältnis `a/b`. Krümmerendstück 2 verwendet ausschliesslich die Tabelle über `wA/w`. Nicht hinterlegte Geometrien werden nicht interpoliert.

### Druckbezug

```text
Abzweig / Endstück: Δp = ζA × p_dyn(wA)
Durchgang:           Δp = ζD × p_dyn(wD)
```

Negative ζ-Werte in den Zusammenfluss-Tabellen sind zulässige Referenzwerte und bleiben erhalten.

Referenzen und Schemata liegen unter `assets/formteile/kruemmer*.xlsx` beziehungsweise `assets/formteile/kruemmer*.png`.
