# Phase 18.23 – Formteil-Anschluss-Sync für zweite Teilstrecken

## Ziel

Formteile sollen nicht nur die Haupt-Teilstrecke übernehmen, sondern bei Übergängen, Abzweigen, T-Stücken und Hosenstücken auch weitere Anschlussseiten direkt aus separaten Teilstrecken ziehen können.

## Umsetzung

- Neue Anschluss-Synchronisation im Formteil-Editor.
- Übergang gross → klein: A2 kommt weiterhin aus der Haupt-Teilstrecke, A1 kann aus einer zweiten Teilstrecke übernommen werden.
- Übergang klein → gross: A1 kommt weiterhin aus der Haupt-Teilstrecke, A2 kann aus einer zweiten Teilstrecke übernommen werden.
- Abzweige / Hosenstücke / T-Stücke / Sattelstücke: AA und WA können aus einer Abzweig-Teilstrecke übernommen werden.
- Durchgangsvarianten: AD und WD können zusätzlich aus einer Durchgangs-Teilstrecke übernommen werden.
- Manuell angepasste Anschlusswerte werden nicht ungefragt überschrieben.
- Button „Anschlüsse übernehmen“ synchronisiert die gewählten Anschlussseiten bewusst neu.

## Nutzen

Die Formteil-Eingabe wird deutlich schneller und sicherer, weil Haupt-, Durchgangs- und Abzweiganschlüsse direkt aus den vorhandenen Teilstrecken übernommen werden können.
