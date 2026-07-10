# Sprint 18.29 – Formteilbibliothek & Auswahl-Assistent

## Ziel

Die Formteilbibliothek soll nicht nur Formteile anzeigen, sondern den Nutzer aktiv führen. Bei der Auswahl soll sofort erkennbar sein, ob ein Formteil zur aktiven Teilstrecke passt, ob Bilder vorhanden sind und welche Formteile automatische Grössen-/Anschlussübernahmen unterstützen.

## Umgesetzt

- Neuer Formteil-Assistent in der Formteil-Auswahl.
- Schnellfilter ergänzt:
  - Alle Formteile
  - Passend zur aktiven Teilstrecke
  - mit α/β-Auswahl
  - mit Grössen-/Anschluss-Sync
- Aktive Teilstrecke wird im Picker angezeigt inkl. Kanal-/Rohrgrösse und Luftmenge.
- Bibliotheks-QS ergänzt:
  - Anzahl Formteile
  - Anzahl Kategorien
  - Formteile mit Bild
  - Formteile mit gesperrter Winkel-Auswahl
  - Formteile mit Grössen-Sync
  - Formteile mit Anschluss-Sync
- Formteilkarten erweitert:
  - Beschreibung
  - Passend-zur-Teilstrecke-Hinweis
  - Bildstatus
  - α/β-Dropdown-Hinweis
  - Grössen-Sync-Hinweis
  - Anschluss-Sync-Hinweis
- Kategorien fachlich beschriftet:
  - Rund / Rohr
  - Rechteck / Kanal
  - Übergänge
  - Abzweige / T-Stücke
  - Spezialformteile

## Verhalten

Die Filter beeinflussen nur die Auswahlansicht. Die bestehenden Rechenfunktionen, automatische Grössenübernahme und Anschluss-Synchronisation bleiben unverändert.

Die α-/β-Werte bleiben weiterhin Dropdown-Auswahlwerte. Freie Winkeleingaben werden nicht freigeschaltet.

## Hinweis

Die fachliche Endprüfung der ζ-Tabellen und Excel-Vergleiche bleibt ein eigener QS-Schritt. Diese Phase verbessert Auswahl, Führung und Fehlervermeidung in der Oberfläche.
