# CHANGELOG

## Sprint 17.18 – Berichtsumfang auswählbar

### Neu
- Berichtansicht um Abschnitt „Berichtsumfang“ erweitert.
- PDF-/HTML-Bericht kann jetzt abschnittsweise zusammengestellt werden.
- Deckblatt bleibt immer aktiv; weitere Abschnitte können ein- oder ausgeblendet werden:
  - Inhaltsverzeichnis
  - Hauptberechnung – Luftnetz
  - Zugeordnete Formteile
  - Sonderbauteile
  - Gesamtzusammenfassung
  - QS-Prüfprotokoll
  - Anhang – Formteilübersicht
  - Prüfung / Freigabe
  - Anlageninformationen / Hinweise

### Verbessert
- Inhaltsverzeichnis und dynamische Seitenzahlen berücksichtigen den gewählten Berichtsumfang.
- Deaktivierte Berichtsteile erscheinen nicht im Druckfenster, PDF, HTML-Bericht und in der Seitenzählung.
- Berichtsumfang wird im Projekt gespeichert.

### Dateien
- src/report/ReportEngine.js
- src/ui/components/WorkspaceComponent.js
- src/ui/ApplicationShell.css
