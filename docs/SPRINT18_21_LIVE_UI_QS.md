# Phase 18.21 – Live-/UI-QS und Deployment-Prüfung erweitert

## Ziel

Die bestehende Deployment-Prüfung soll nicht nur Dateien und Cache-Versionen prüfen, sondern auch erkennen, ob die sichtbare Oberfläche nach dem Hochladen sauber gerendert wird.

## Umgesetzt

- Cache-Version auf `18.21` erhöht.
- Deployment-QS erweitert um sichtbare UI-Prüfung:
  - Shell
  - Ribbon
  - Sidebar
  - Arbeitsbereich
  - Statusbar
- Prüfung ergänzt, ob das Eigenschaftenfenster weiterhin ausgeblendet bleibt.
- Ribbon-Befehle werden auf Vollständigkeit geprüft.
- Horizontales Seitenüberlaufen und Ribbon-Überlauf werden als Hinweis gemeldet.
- Bildschutzprüfung erweitert:
  - Logo geladen?
  - Drag-Schutz bei Bildern vorhanden?
- Pflichtdateien für Workspace, Ribbon-Aktionen, Deployment-Diagnose und Versionszentrale ergänzt.
- Ribbon-CSS für kleinere Fenster stabilisiert.

## Hinweis

`Deploy prüfen` ist jetzt gleichzeitig eine kleine Live-/UI-QS. Nach dem Hochladen auf GitHub Pages kann darüber geprüft werden, ob die wichtigsten Startmodule, Bilder und sichtbaren Oberflächenbereiche erreichbar sind.
