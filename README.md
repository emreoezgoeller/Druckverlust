# Druckverlust Pro Professional

Webbasierte Druckverlustberechnung für Lüftungstechnik – entwickelt aus der Praxis für den Planungsalltag.

**Projektidee / Fachliche Vorlage:** Emre Özgöller  
**Ziel:** Excel ersetzen, Berechnungen vereinfachen und professionelle PDF-Berichte erzeugen.

## Online nutzen
Die Anwendung kann direkt über GitHub Pages oder Cloudflare Pages veröffentlicht werden.  
Startdatei: `index.html`

## Aktueller Stand
Diese Version ist die GitHub-Startbasis für die weitere Entwicklung.

Enthalten:
- Hauptberechnung mit Kanal/Rohr/Sonderbauteil
- Formteilbilder und Rechnerbasis
- PDF-Export als echte PDF-Erzeugung
- Projekt speichern/öffnen als `.dp`
- GitHub-Struktur mit Roadmap, Changelog und Testplan

## Projektstruktur

```text
Druckverlust-Pro/
├── index.html
├── assets/
│   ├── logo.png
│   └── formteile/
├── src/
│   ├── app.js
│   ├── style.css
│   ├── calculation/
│   ├── formteile/
│   ├── pdf/
│   ├── project/
│   └── ui/
├── docs/
│   ├── ARCHITEKTUR.md
│   └── TESTPLAN.md
├── tests/
│   └── reference/
├── ROADMAP.md
└── CHANGELOG.md
```

## Entwicklungsregeln
1. Keine Funktion wird als fertig markiert, bevor sie bedienbar ist.
2. Berechnungen werden gegen Excel-Referenzen geprüft.
3. PDF-Ausgabe darf keine leeren Seiten, Dateipfade oder Browser-Kopfzeilen enthalten.
4. Formteile werden mit Originalbild, Parametern und Referenzformel dokumentiert.
5. Neue Versionen werden über Changelog und Roadmap nachvollziehbar geführt.

## Nächster Sprint
**Sprint 1:** Berechnungs-Engine modularisieren und Formteilbibliothek vorbereiten.
