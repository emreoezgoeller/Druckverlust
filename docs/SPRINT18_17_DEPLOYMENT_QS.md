# Sprint 18.17 – Deployment-QS und finale Startdiagnose

## Ziel

Nach den letzten GitHub-Pages-Problemen mit Cache, Modulpfaden und Bildern bekommt Druckverlust Pro eine eigene Deployment-Prüfung direkt in der Oberfläche.

## Neu

- Ribbon-Button **Deploy prüfen** ergänzt.
- Neue Datei `src/diagnostics/DeploymentDiagnostics.js`.
- Prüfung kontrolliert:
  - aktueller GitHub-Pages-Pfad,
  - Cache-Version von `src/main.js`,
  - Cache-Version von `ApplicationShell.css`,
  - Pflichtmodule,
  - Logo und Berichtsbilder,
  - Formteilbilder für Übergänge,
  - vorhandenes Projekt,
  - vorhandenes Berechnungsergebnis,
  - Bildschutz beim Ribbon-Logo.
- Ergebnis wird als eigene Seite in der Arbeitsfläche angezeigt.
- Zusammenfassung kann kopiert werden.

## Geänderte Dateien

- `index.html`
- `CHANGELOG.md`
- `ROADMAP.md`
- `src/main.js`
- `src/diagnostics/DeploymentDiagnostics.js`
- `src/ui/components/RibbonComponent.js`
- `src/ui/core/RibbonActions.js`
- `src/ui/components/WorkspaceComponent.js`
- `src/ui/components/StatusBarComponent.js`
- `src/ui/ApplicationShell.css`

## Hinweis

Die Prüfung ersetzt keinen echten Browser-Test, zeigt aber schnell, ob die typischen GitHub-Pages-Probleme wieder auftreten: falscher Pfad, alte Cache-Version oder fehlende Bilddateien.
