# Changelog

## 0.4.2 – CalculationEngine abgeschlossen

### Neu
- Zentrale, DOM-unabhängige `CalculationEngine` in `src/core/CalculationEngine.js`.
- Kompatibilitäts-Exporte für `src/calculation/CalculationEngine.js` und `src/calculation/engine.js`.
- Berechnung für Rechteckkanal, Rohr und Sonderbauteile.
- Automatische Berücksichtigung von `zetaSum` und zugeordneten Formteilen.
- Plausibilitätswarnungen vorbereitet.
- Browser-Referenztest für TEST-001 ergänzt.
- Dokumentation `docs/CALCULATION_ENGINE.md` ergänzt.

### Wichtig
- Diese Version ändert die bestehende Oberfläche nicht.
- Ziel ist ein stabiles Rechenfundament, bevor UI und PDF weiter professionalisiert werden.
