# Sprint 18.20a – PDF-Δp-Spalte korrigiert

## Anlass

In der PDF-Haupttabelle war die Spalte `Δp Pa` nicht eindeutig. Bei Teilstrecken mit Formteilen wurde der Reibungsverlust teilweise mit Formteilverlusten gemischt. Bei Teilstrecken ohne Direktverlust konnte durch einen undefinierten Wert `-` erscheinen, obwohl die Rohr-/Kanaldaten vorhanden waren.

## Anpassung

Die Haupttabelle `Hauptberechnung – Luftnetz` zeigt jetzt in der letzten Spalte ausschliesslich:

```text
Δp Kanal/Rohr = Reibungsdruckverlust der Teilstrecke
```

Formteilverluste bleiben im separaten Bereich `Zugeordnete Formteile` und in der Zusammenfassung ausgewiesen.

## Ergebnis

- Die Einzelwerte der Haupttabelle passen zur Fusszeile `Summe Kanäle / Teilstrecken`.
- Rohr-Teilstrecken ohne Formteile zeigen wieder einen berechneten Wert statt `-`.
- Die PDF-Legende beschreibt die Bedeutung der Spalte eindeutiger.
