# Release Notes

**Release:** 2.6.1 · Phase 51.10  
**Datum:** 20.07.2026

## Neu in Phase 51.10

- Sechs neue rechteckige Formteile: **Krümmerabzweig 1 – Abzweig**, **Krümmerabzweig 1 – Durchgang**, **Krümmerabzweig 2 – Abzweig**, **Krümmerabzweig 2 – Durchgang**, **Krümmerendstück 1** und **Krümmerendstück 2**.
- Eingabebilder und Tabellen stammen aus den bereitgestellten PNG- und Excel-Referenzen.
- Bei den Krümmerabzweigen wird die Geometrie über `AA/AD`, `AD/A` und `AA/A` exakt gewählt. Das Verhältnis `wA/w` beziehungsweise `wD/w` verwendet wie Excel den exakten oder nächst kleineren Tabellenwert.
- Krümmerendstück 1 berücksichtigt zusätzlich das exakte Seitenverhältnis `a/b`; Krümmerendstück 2 verwendet `wA/w`.
- Abzweig- und Endstückverluste beziehen sich auf den dynamischen Druck bei `wA`; Durchgangsverluste auf den dynamischen Druck bei `wD`.
- Zusammenflussvarianten dürfen negative ζ- und Druckverlustwerte liefern; diese Tabellenwerte werden unverändert übernommen.
- Die drei Anschluss-Teilstrecken eines Krümmerabzweigs und die zwei Anschlüsse eines Krümmerendstücks werden automatisch synchronisiert und bleiben manuell umstellbar.
- Unzulässige Geometriekombinationen werden nicht interpoliert, sondern mit einer klaren Prüfmeldung gestoppt.
- 65 automatisierte Phase-51.10-Prüfungen, 25 Excel-Referenzfälle mit 81 Einzelprüfungen sowie 179 Formteil-Synchronisationsprüfungen bestanden.

## Neu in Phase 51.00

- Logo, Werkzeugleiste und Projektstatus sind in einer kompakten, einzeiligen Plattformleiste zusammengeführt.
- Die bisherigen Gruppenbezeichnungen erzeugen auf dem Desktop keine zweite sichtbare Ribbon-Zeile mehr; Überlaufnavigation und Tastaturbedienung bleiben erhalten.
- Neue Symbol- und Statuslegende erklärt Teilstrecke, Formteil, Sonderbauteil, Berechnung, Bericht sowie die Statusfarben.
- Sofortige Infotexte erscheinen bei Mausberührung oder Tastaturfokus für Ribbon-, Sidebar- und Arbeitsbereichssymbole.
- Sidebar, Projektbaum und Arbeitsbereich sind gegen horizontales Überragen und abgeschnittene Auswahlmarkierungen abgesichert.
- Tablet- und Smartphone-Darstellung der Werkzeugleiste und Legende wurden ergänzt.
- 48 automatisierte Phase-51-Prüfungen ergänzt.

## Phase 50.00

- Neue Formteile werden aus dem aktuellen Teilstrecken-Kontext angelegt; die Ziel-Teilstrecke kann in der Bibliothek vorab geändert werden.
- Einbauposition und Reihenfolge sind im Formteilarbeitsplatz sofort sichtbar.
- Vorherige und nächste Teilstrecke können direkt aus dem Formteil angesteuert werden.
- Manuelle Anschlusswerte bleiben bei einer Umzuordnung geschützt; automatische Übernahme erfolgt nur noch bewusst.
- Zusatzanschlüsse von Übergängen und Abzweigen erhalten prüfbare Vorschläge aus den folgenden Teilstrecken.
- Fehlende, gelöschte oder widersprüchliche Zuordnungen werden klar gemeldet.
- Sortierpfeile verändern nur die Reihenfolge innerhalb derselben Teilstrecke.
- 37 automatisierte Phase-50-Prüfungen ergänzt.

## Phase 49.00

- Neuer herstellerneutraler **Dimensionierungsassistent** direkt in jeder Teilstrecke.
- Zielgeschwindigkeit über 2,0 / 3,0 / 4,0 m/s oder einen eigenen Wert von 0,5 bis 12,0 m/s wählbar.
- Bis zu vier passende Standardabmessungen für Rechteckkanäle beziehungsweise Rundrohre.
- Bestehende Abmessungen werden erst nach ausdrücklicher Auswahl eines Vorschlags verändert.
- Aktuelle Geschwindigkeit und Abweichung zum Ziel werden verständlich angezeigt.
- Breite, Höhe und Durchmesser werden in Editor und Schnellerfassung in **Millimeter** dargestellt; das Rechenmodell bleibt unverändert in Meter.
- Neue Schnellfunktion **„+ nächste TS mit gleicher Grösse“** übernimmt Luftmenge, Querschnitt, Abmessungen und Rauigkeit, setzt die Länge jedoch bewusst auf 0 m.
- Alte Projekte mit in Millimeter gespeicherten Abmessungen werden im Assistenten kontrolliert erkannt.
- 54 automatisierte Phase-49-Prüfungen ergänzt.

## Phase 48.00

- Teilstreckenfelder fachlich neu geordnet.
- Neue Formteile werden automatisch der zuletzt erstellten Teilstrecke zugeordnet.
- Die Zuordnung bleibt im Formteileditor manuell änderbar.

## Bewusst ausgeschlossen

- keine Ventilatorauslegung, Motorleistung, SFP-, Energie- oder Betriebskostenberechnung,
- keine Hersteller-, Produkt- oder Artikelnummerndatenbank.
