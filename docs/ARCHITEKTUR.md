# Architektur

## Module
- `src/calculation/engine.js` – Berechnungen für Kanal, Rohr, Sonderbauteile und Summen
- `src/formteile/library.js` – Formteilbibliothek, Bilder, Parameter, Zeta-Berechnung
- `src/pdf/report.js` – PDF-Bericht
- `src/project/storage.js` – Projekt speichern/öffnen
- `src/core/state.js` – zentraler Zustand
- `src/main.js` – UI-Steuerung

## Grundsatz
Die Oberfläche darf keine Fachlogik enthalten. Fachlogik gehört in die Engine.
