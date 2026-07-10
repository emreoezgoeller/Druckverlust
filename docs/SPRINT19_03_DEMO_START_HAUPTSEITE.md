# Sprint 19.03 – Demo-Start von der Hauptseite

## Ziel

Die Produktseite soll nicht nur allgemein zum Tool führen, sondern das Demo-Projekt direkt starten können.

## Umsetzung

- Der Button „Demo-Projekt testen“ auf `index.html` und `produkt.html` verweist jetzt auf `app.html?demo=1`.
- `src/main.js` erkennt den Parameter `demo=1` und lädt automatisch `createDemoProject()`.
- Eine vorhandene Autosicherung wird nicht still überschrieben: Die App fragt, ob die Sicherung wiederhergestellt oder das Demo-Projekt geladen werden soll.
- Der Demo-Parameter wird nach dem Laden aus der Adresse entfernt, damit ein späteres Neuladen nicht unbeabsichtigt wieder das Demo-Projekt erzwingt.
- Cache-Version auf `19.03` erhöht.

## Geänderte Dateien

- `index.html`
- `produkt.html`
- `app.html`
- `CHANGELOG.md`
- `README.md`
- `ROADMAP.md`
- `docs/SPRINT19_03_DEMO_START_HAUPTSEITE.md`
- `src/core/appVersion.js`
- `src/main.js`
- `src/pdf/report.js`
- `src/ui/components/WorkspaceComponent.js`
