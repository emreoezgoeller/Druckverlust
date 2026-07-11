# Phase 21.01 – Formteilbibliothek und Excel-Referenzprüfung

## Ziel

Die Formteilbibliothek soll nicht nur funktional erscheinen, sondern automatisiert gegen feste Referenzpunkte abgesichert sein. Änderungen an Tabellenlogik, Suchrichtung, Dateipfaden oder Metadaten müssen bei einem Testlauf sichtbar werden.

## Umfang

- 14 registrierte Formteile vollständig im Manifest geführt
- 18 Excel-Referenzfälle
- 56 Einzelprüfungen der ζ-Werte, Tabellenachsen und Bezugsdrücke
- 87 strukturelle Prüfungen der Bibliotheksdefinitionen
- 28 physische Asset-Prüfungen für Bild und Excel-Datei
- 14 Manifest-Prüfungen

## Korrigierte Suchregeln

### Hosenstück

Der Quotient `wA/w` verwendet gemäss Excel-Vorlage den exakten oder nächst kleineren Tabellenwert. Der Winkel α bleibt auf der vorgesehenen Auswahlachse.

### T-Abzweig rund 2

Das Flächenverhältnis `AA/A` wird gemäss der Excel-IF-Logik in die Bänder 0.1, 0.3 und 0.5 eingeordnet. Winkel und Geschwindigkeitsverhältnis verwenden den exakten oder nächst kleineren Tabellenwert.

### 90° T-Stück Variante 2

`AA/A` verwendet die nächst grössere Tabellenzeile; `wA/w` den exakten oder nächst kleineren Tabellenwert.

## Bedienung

Im Tool:

**Rechen-QS → Formteil-QS**

Im Browser:

`tests/phase21-formpart-validation.html`

In Node.js:

```bash
npm test
npm run test:formparts
```

## Einordnung

Die Tests sind Regressionstests gegen die im Projekt hinterlegten Excel-Dateien und deren gespeicherte Referenzwerte. Sie belegen die interne Übereinstimmung dieser Implementierung, ersetzen aber keine externe fachliche oder normative Zertifizierung.
