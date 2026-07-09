# Sprint 18.12d – Logo und Eigenschaftenfenster

## Ziel

Die Oberfläche wurde optisch aufgeräumt: Das EO-Logo steht jetzt vor dem Titel „Druckverlust Pro“. Das rechte Eigenschaftenfenster wird vorerst ausgeblendet, damit im Bericht und in der Arbeitsfläche mehr nutzbarer Platz zur Verfügung steht.

## Anpassungen

- `RibbonComponent` zeigt das vorhandene EO-Logo aus `assets/logo/eo-logo.png` links neben dem Anwendungstitel.
- `ApplicationShell` rendert keine sichtbare rechte Eigenschaften-Spalte mehr.
- `ApplicationShell.css` wurde von 3 Spalten auf 2 Spalten umgestellt.
- `main.js` startet die Oberfläche ohne `PropertiesComponent`.
- Die Datei `PropertiesComponent.js` bleibt bewusst im Projekt. Sie kann später wieder genutzt werden, wenn Eigenschaften direkt im rechten Bereich bearbeitet werden sollen.

## Hinweis

Das Eigenschaftenfenster hat aktuell keine zwingende Rolle für die Bedienung. Für spätere Funktionen wie Detailbearbeitung, Prüfstatus, Formteilparameter oder Schnellkorrekturen kann es bei Bedarf wieder eingeblendet werden.
