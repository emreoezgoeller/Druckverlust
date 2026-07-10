# Sprint 18.31 – Rechen-QS und fachlicher Nachweis

## Ziel

Die Berechnung soll nicht nur ein Ergebnis liefern, sondern intern nachvollziehbar geprüft werden. Dadurch lassen sich auffällige Eingaben, Rundungen und Summenfehler schneller erkennen.

## Umgesetzt

- Neues Modul `src/diagnostics/CalculationDiagnostics.js`.
- Neuer Ribbon-Button **Rechen-QS**.
- Neue Rechen-QS-Detailseite in der Arbeitsfläche.
- Kompakter Rechen-QS-Block in der Anlagenübersicht.
- QS-Zusammenfassung kann kopiert werden.

## Prüfungen

- Gesamtsumme: Reibung + ζ-Formteile + Direkt-Formteile + Sonderbauteile.
- Rundung: gerundetes Total gegen ungerundetes Total.
- Einzelresultate: Summe aller Teilstrecken und Sonderbauteile gegen Systemtotal.
- Teilstrecken: Ergebnisanzahl, Geschwindigkeit, `p_dyn = ρ/2 × v²`, Reibungsverlust `R × Länge`.
- Formteile: gültige Teilstreckenzuordnung und vorhandene ζ-/Direktergebnisse.
- Sonderbauteile: Ergebnisanzahl und positiver Druckverlust.
- Einstellungen: Luftdichte, Rohrreibungszahl und Rundungsschritt.

## Hinweis

Der Rechen-QS ersetzt keine fachliche Normprüfung, hilft aber dabei, technische Auffälligkeiten im Projekt früh sichtbar zu machen.
