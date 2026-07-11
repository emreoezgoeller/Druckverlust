# Phase 19.11 – Deployment-Feinschliff, Sitemap und App-Metadaten

## Ziel

Druckverlust Pro wird für die öffentliche GitHub-Pages-Bereitstellung sauberer vorbereitet. Die Produktseite bleibt `index.html`, das Tool bleibt `app.html`.

## Neu

- `site.webmanifest` ergänzt.
- `robots.txt` ergänzt.
- `sitemap.xml` ergänzt.
- `404.html` als eigene Fehlerseite ergänzt.
- Manifest-Link auf Produktseite, Toolseite, Impressum und Datenschutz ergänzt.
- Mobile Web-App-Metadaten ergänzt.
- Cache-Version auf `19.11` erhöht.

## Hinweise

- Es wurde bewusst kein Service Worker ergänzt, damit keine aggressiven Browser-Caches entstehen.
- Für GitHub Pages müssen die neuen Dateien im Root des Repositorys liegen.
- Nach dem Hochladen kurz warten und mit `Ctrl + F5` neu laden.

## Geänderte / neue Dateien

- `index.html`
- `produkt.html`
- `app.html`
- `impressum.html`
- `datenschutz.html`
- `404.html`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`
- `src/landing/landing.css`
- `src/core/appVersion.js`
- `src/main.js`
- `src/pdf/report.js`
- `src/ui/components/WorkspaceComponent.js`
- `CHANGELOG.md`
- `README.md`
- `ROADMAP.md`
