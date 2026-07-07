# Druckverlust Pro Professional

Webbasierte Druckverlustberechnung für Lüftungstechnik.

**Fachliche Vorlage / Idee:** Emre Özgöller

## Version

`0.4.0` – Stabiler Arbeitsstand für GitHub Pages

## Enthalten

- Funktionierende Hauptberechnung mit Kanal / Rohr / Sonderbauteil
- Teilstrecken hinzufügen, bearbeiten und löschen
- Formteilbibliothek mit Originalbildern
- Formteil-Rechner mit Teilstrecken-Zuweisung
- Automatische Σζ-Übernahme in die Hauptberechnung
- Projekt speichern / öffnen als `.dp`
- PDF-Bericht mit eigenem PDF-Generator über jsPDF
- TEST-001 Referenzfall

## GitHub Pages

Die App läuft als statische Webseite. Startdatei: `index.html`.

## Wichtig

Die aktuell hinterlegten Zeta-Formeln sind weiterhin Arbeitslogik. Die Formeln werden in Sprint 3 je Formteil gegen die Excel-Dateien geprüft und schrittweise 1:1 ersetzt.


## Sprint 16 Abschluss-Test

Der finale QS-Test für die Formteilbibliothek liegt unter:

```text
tests/sprint16-final.html
```

Die Datei im Browser öffnen, um Registry, Calculatoren, Projektberechnung, QS-Status und Speichern zu prüfen.

## Sprint 17 – Bericht und Export

Sprint 17 stellt die Berichtsausgabe bereit: A4-Bericht, PDF/Druckansicht, HTML-Bericht mit eingebetteten Bildern, CSV-Datenexport, Berichtsumfang, Vorlagen, QS-Protokoll, Revisionsverlauf und Prüfung/Freigabe.

Abschluss-Test:

```text
tests/sprint17-final.html
```


### Sprint 18 – Bedienkomfort

Sprint 18 startet mit Projektangaben und Teilstreckenverwaltung. Projektname, Objekt, Anlage, Bearbeiter, Firma, Adresse und Bemerkungen können direkt in der Oberfläche gepflegt werden. Teilstrecken lassen sich duplizieren, löschen, verschieben und automatisch neu nummerieren.
