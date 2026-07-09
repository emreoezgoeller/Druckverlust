# Sprint 18.14 – Tastaturkürzel und Kontextaktionen

Dieser Sprint verbessert die Bedienung in grösseren Projekten.

## Neu

- Zentrale Tastatursteuerung über `src/ui/core/KeyboardShortcuts.js`
- Speichern, Öffnen, neues Projekt, Berechnung und Bericht direkt über Tastatur
- Kontextaktionen für aktuell gewählte Elemente:
  - Teilstrecke duplizieren/löschen/verschieben
  - Formteil duplizieren/löschen/verschieben
  - Sonderbauteil duplizieren/löschen/verschieben
- Hilfe-Schaltfläche im Ribbon mit Übersicht der Kurzbefehle
- Statusbar mit wichtigsten Shortcuts

## Tastaturkürzel

| Kürzel | Funktion |
| --- | --- |
| Ctrl + S | Projekt speichern |
| Ctrl + O | Projekt öffnen |
| Ctrl + N | Neues Projekt |
| Ctrl + Enter | Neu berechnen |
| Ctrl + B / Ctrl + P | Bericht öffnen |
| Ctrl + D | ausgewähltes Element duplizieren |
| Entf | ausgewähltes Element löschen |
| Ctrl + Alt + ↑ / ↓ | ausgewähltes Element verschieben |
| Esc | zurück zur Anlagenübersicht |

## Hinweis

Die Löschfunktion fragt weiterhin nach Bestätigung. Eingabefelder werden geschützt: `Entf` oder `Backspace` löscht nur Text im Feld und nicht das ausgewählte Projektelement.
