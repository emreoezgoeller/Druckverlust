# Druckverlust Pro – Architektur v0.4.1

## Grundsatz
Die Benutzeroberfläche darf nicht die Berechnungslogik enthalten. Alle Fachberechnungen laufen langfristig über zentrale Engines.

## Kernmodule

```text
src/core/CalculationEngine.js   – Kanal, Rohr, Druckverlust, Summen
src/core/ProjectSchema.js       – einheitliche Projekt-/Teilstreckenstruktur
src/core/FormPartRegistry.js    – Liste aller verfügbaren Formteile
src/core/FormPartEngine.js      – ζ-Berechnung und Zuweisung
src/core/ProjectEngine.js       – Projektoperationen und Neuberechnung
```

## Ziel
- bestehende Web-App bleibt lauffähig
- neue Module werden schrittweise angeschlossen
- keine bestehenden Funktionen werden gelöscht
- jede Berechnung erhält einen Referenztest gegen Excel
