# Sprint 18.12c – Bilderpfade und Kopierschutz

## Ziel

Die auf GitHub Pages gemeldeten 404-Fehler bei Bildern wurden behoben. Zusätzlich wurden alle Bild-/Skizzenbereiche mit einem einfachen Kopierschutz versehen.

## Anpassungen

- `ReportEngine.toAbsoluteAssetUrl()` lädt Assets jetzt relativ zur aktuellen Projektseite.
- Dadurch funktionieren Bilder auch unter `https://emreoezgoeller.github.io/Druckverlust/`.
- `index.html` nutzt `?v=18.12c` für Cache-Busting.
- `src/main.js` und `WorkspaceComponent.js` laden geänderte Module mit Versionsparameter.
- Rechtsklick, Ziehen und Markieren von Bildern wird in Hauptoberfläche und Bericht blockiert.
- Bilder erhalten `draggable="false"` und Schutz-CSS.

## Hinweis

Ein absoluter Schutz gegen Screenshots oder Browser-Entwicklertools ist technisch nicht möglich. Die Massnahme verhindert aber normales Kopieren, Ziehen und Rechtsklick-Speichern in der Oberfläche.
