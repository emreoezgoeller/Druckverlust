# Sprint 18.19 – Struktur-Cleanup und Altlastenbereinigung

## Ziel

Phase 18.19 räumt die Projektstruktur nach der Umstellung auf die professionelle Phase-18-Oberfläche auf. Die aktive Web-App bleibt unverändert nutzbar, aber alte Parallelstrukturen und Übergabedateien werden aus dem sauberen Projektstand entfernt.

## Bereinigt

Entfernt wurden ausschliesslich Dateien, die für die aktuelle Startseite nicht mehr benötigt werden oder alte Test-/Übergabestrukturen darstellen:

- `.git/` aus der ZIP-Übergabe entfernt.
- alte Übergabelisten `GEAENDERTE_DATEIEN_18_12c.txt` und `GEAENDERTE_DATEIEN_18_12d.txt` entfernt.
- alte einfache Oberfläche entfernt: `src/app.js`, `src/style.css`, `src/ui/styles.css`.
- alte doppelte Projekt-/Core-Module entfernt, wenn sie nicht mehr von Phase 18 genutzt werden.
- alte Referenz-Testseiten und Referenz-Testskripte entfernt; die JSON-Referenzdaten für aktuelle Tests bleiben erhalten.

## Bewusst behalten

Folgende Dateien bleiben trotz Kompatibilitätscharakter bewusst erhalten:

- `src/calculation/engine.js` – Kompatibilitäts-Engine für Deploy-QS und alten PDF-Kompatibilitätscheck.
- `src/pdf/report.js` – alter PDF-Kompatibilitätsexport, wird durch Deployment-QS geprüft.
- `src/formteile/library.js` – Legacy-Formteildefinitionen für den PDF-Kompatibilitätspfad.
- `src/ui/components/PropertiesComponent.js` – aktuell ausgeblendet, später für Detailbearbeitung wieder nutzbar.
- Formteilbilder und Excel-Referenzen – bewusst nicht reduziert, um Bildpfade und spätere Nachpflege nicht zu beschädigen.

## Version

- App-Version / Cache-Version: `18.19`
- `index.html`, `src/main.js`, `WorkspaceComponent`, `ReportEngine` und PDF-Kompatibilitätsmodul wurden auf die neue Cache-Version angepasst.

## Hinweis für GitHub

Für diese Cleanup-Phase ist die Gesamt-ZIP am sinnvollsten, weil gelöschte Dateien beim einfachen Hochladen der Änderungs-ZIP nicht automatisch aus GitHub entfernt werden. Die Änderungs-ZIP enthält zusätzlich eine Löschliste.
