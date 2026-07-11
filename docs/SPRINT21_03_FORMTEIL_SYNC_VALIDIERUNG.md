# Phase 21.03 – Formteil-Grössen- und Anschluss-Synchronisation

## Ziel

Die in Phase 18.20 bis 18.23 eingeführte automatische Grössenübernahme wird für alle registrierten Formteile als feste Regression abgesichert. Zusätzlich wird geprüft, dass Änderungen an Haupt-, Durchgangs- und Abzweig-Teilstrecken korrekt nachgeführt werden, ohne manuell geschützte Werte ungefragt zu überschreiben.

## Umgesetzt

- DOM-unabhängiger Test-Runner `src/testing/FormPartSyncRunner.js`
- Diagnosemodul `src/diagnostics/FormPartSyncDiagnostics.js`
- Tool-Ansicht unter **Rechen-QS → Formteil-Sync-QS**
- Browser-Testseite `tests/phase21-formpart-sync.html`
- Node-Testbefehl `npm run test:sync`
- Integration in den vollständigen Lauf `npm test`

## Fachliche Korrekturen

Die Anschlussauswahl wird nicht mehr nur anhand des Formteilnamens erkannt, sondern anhand der tatsächlich vorhandenen Parameter:

- `AD_*` + `WD` → Durchgangs-Teilstrecke
- `AA_*` + `WA` → Abzweig-Teilstrecke
- Übergänge → zweite Anschlussseite `A1` beziehungsweise `A2`

Dadurch gilt jetzt:

- `T-Abzweig rund 1` und `T-Abzweig rund 2` erhalten auch die benötigte Durchgangszuordnung `AD/WD`.
- `T-Abzweig Durchgang rund 1` zeigt keinen wirkungslosen Abzweig-Selector mehr, da dieses Formteil keine `AA/WA`-Parameter besitzt.
- Änderungen an einer Anschluss-Teilstrecke aktualisieren das zugehörige Formteil automatisch.
- Beim Aktualisieren der Haupt-Teilstrecke bleiben separat gewählte Durchgangs- und Abzweiggrössen erhalten.
- Manuelle Overrides pausieren die automatische Übernahme weiterhin; eine erzwungene Synchronisation ist bewusst möglich.

## Prüfumfang

- 14/14 Formteile abgedeckt
- 15 Testfälle
- 113 Einzelprüfungen
- Kanal-/Rohrumrechnung von m nach mm
- Hauptanschluss, Übergangsseite, Durchgang `AD/WD`, Abzweig `AA/WA`
- manuelle Overrides
- erzwungene Synchronisation
- automatische Nachführung bei geänderten Anschluss-Teilstrecken

## Ergebnis

Sollstatus: **15/15 Testfälle und 113/113 Einzelprüfungen bestanden**.
