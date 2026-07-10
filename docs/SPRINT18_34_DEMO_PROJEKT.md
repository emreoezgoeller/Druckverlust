# Phase 18.34 – Demo-Projekt und Vorführmodus

## Ziel

Für Vorführung, QS und Tests soll ein vollständiges Beispielprojekt direkt aus der Oberfläche geladen werden können.

## Umsetzung

- Neue Datei `src/project/demoProject.js` ergänzt.
- Neuer Ribbon-Button **Demo** ergänzt.
- `RibbonActions.loadDemoProject()` lädt das Demo-Projekt nach Sicherheitsabfrage bei ungespeicherten Änderungen.
- Das Demo-Projekt enthält:
  - Projektangaben
  - 5 Teilstrecken
  - 5 Formteile
  - 3 Sonderbauteile
  - Berichtnummer und Revision

## Nutzen

- Schneller Funktionstest ohne manuelle Eingabe.
- Rechen-QS, Datei-QS, Projekt-QS und Deploy-QS können sofort geprüft werden.
- Bericht/PDF kann mit realistischeren Beispieldaten geöffnet werden.

## Hinweis

Das Demo-Projekt ist eine Vorlage. Herstellerwerte und fachliche Auslegungswerte sind bei echten Projekten weiterhin projektspezifisch zu prüfen.
