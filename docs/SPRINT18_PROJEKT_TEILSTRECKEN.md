# Sprint 18.1/18.2 – Projektangaben und Teilstreckenverwaltung

## Ziel

Sprint 18 startet den Bereich Bedienkomfort. Die wichtigsten Projektangaben werden zentral editierbar und die Teilstrecken können direkt in der Oberfläche verwaltet werden.

## Neu

### Projektangaben

Im Projektbereich können jetzt gepflegt werden:

- Projektname
- Objekt
- Anlage
- Anlagennummer
- Bearbeiter
- Firma
- Adresse / Standort
- Bemerkungen

Die Angaben werden im Projektmodell gespeichert und mit den Berichtsangaben synchronisiert.

### Teilstreckenverwaltung

In der Anlagenübersicht gibt es eine neue Verwaltung für Teilstrecken:

- Teilstrecke hinzufügen
- Teilstrecke auswählen
- Teilstrecke duplizieren
- Teilstrecke löschen
- Teilstrecke nach oben/unten verschieben
- Teilstrecken als `ts1`, `ts2`, `ts3` neu nummerieren

Im Teilstrecken-Editor können Name und Beschreibung direkt bearbeitet werden.

## Verhalten beim Löschen

Beim Löschen einer Teilstrecke werden zugeordnete Formteile nicht gelöscht. Sie werden der nächsten verfügbaren Teilstrecke zugewiesen oder bleiben ohne Zuordnung, wenn keine Teilstrecke mehr vorhanden ist. Dadurch gehen keine Formteile verloren.

## Test

Browser-Test:

```text
tests/sprint18-project-sections.html
```
