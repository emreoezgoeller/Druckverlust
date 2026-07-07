# CHANGELOG – Sprint 17.23

## Sprint 17.23 – Revisionsverlauf im Bericht

### Neu
- In der Berichtansicht gibt es im Bereich „Prüfung / Freigabe“ jetzt einen editierbaren Revisionsverlauf.
- Der Revisionsverlauf erscheint im PDF-Bericht auf der Seite „Prüfung / Freigabe“.
- Der CSV-Datenexport enthält jetzt ebenfalls den Revisionsverlauf.

### Geändert
- Wenn noch kein Revisionsverlauf vorhanden ist, wird automatisch eine erste Zeile aus Revision, Datum und Bearbeiter erzeugt.
- Leere Revisionszeilen werden nicht in den Bericht übernommen.

### Dateien
- `src/report/ReportEngine.js`
- `src/ui/components/WorkspaceComponent.js`
- `src/ui/ApplicationShell.css`

## Sprint 17 Abschluss – Bericht / Export finalisiert

- Berichtsabschluss in der Oberfläche ergänzt: Seitenzahl, aktive Inhaltsbereiche, ausgeblendete leere Einträge und Dateibasis.
- ReportEngine um Abschlusszusammenfassung erweitert.
- CSV-Export um Abschnitt „Berichtsabschluss“ erweitert.
- Standalone-HTML mit Generator-Metadaten ergänzt.
- Abschlussdokumentation `docs/SPRINT17_ABSCHLUSS.md` ergänzt.
- Abschluss-Test `tests/sprint17-final.html` und `tests/sprint17-final.test.js` ergänzt.

## Sprint 18.1/18.2 – Projektangaben und Teilstreckenverwaltung

- Projektangaben zentral editierbar gemacht.
- Projektmetadaten mit Berichtsdaten synchronisiert.
- Teilstreckenverwaltung in der Anlagenübersicht ergänzt.
- Teilstrecken können dupliziert, gelöscht, verschoben und neu nummeriert werden.
- Teilstrecken-Editor um Name und Beschreibung erweitert.
- Sidebar-Zähler für Teilstrecken, Formteile und Sonderbauteile ergänzt.
- Sprint-18-Test für Projekt- und Teilstreckenverwaltung ergänzt.
