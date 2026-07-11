# Phase 21.06 – Einheitliches Oberflächendesign

## Ziel

Das Berechnungstool soll visuell zur Produkt-/Hauptseite gehören, ohne den bestehenden Marken- und Informationsblock im Kopfbereich zu verlieren.

## Umsetzung

- Markenblock mit EO-Logo, **Druckverlust Pro** und **Professional** beibehalten.
- Kopfbereich von dunklem Ribbon auf helle, leicht transparente Navigation im Stil der Hauptseite umgestellt.
- Hauptaktionen mit blauem Verlauf hervorgehoben.
- Sidebar, Arbeitsbereich und Statusleiste als abgerundete, schwebende Flächen gestaltet.
- Karten, Formulare, Tabellen, Chips, Hinweise und Buttons vereinheitlicht.
- Fokuszustände und responsive Darstellung verbessert.
- Bild-Kopierschutz und alle bisherigen Funktionen bleiben erhalten.

## Technische Umsetzung

Die Gestaltung liegt als separates, zuletzt geladenes Override in `src/ui/phase21_06.css`. Dadurch bleibt die bestehende UI-Struktur erhalten und kann bei Bedarf gezielt angepasst werden.

## Nicht verändert

- Rechenkern
- Formteilberechnungen
- Projektdatei `.dvp`
- Bericht/PDF-Inhalt
- Fachtest- und QS-Logik
