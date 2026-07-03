# Architektur – Druckverlust Pro Professional

## Ziel
Druckverlust Pro soll Excel im Arbeitsablauf ersetzen, nicht nur nachbauen.
Die Software führt Planer durch Teilstrecken, Formteile und Sonderbauteile und erzeugt einen professionellen Berechnungsbericht.

## Grundprinzipien
- Berechnungslogik getrennt von Oberfläche
- Formteile als erweiterbare Bibliothek
- Projektdateien als `.dp`
- PDF-Export aus Datenmodell, nicht aus Browserdruck
- Jede Formel mit Excel-Referenztest prüfen

## Module

### `src/calculation`
Berechnung von Kanal, Rohr, dynamischem Druck, Reibungsverlust, Formteilverlusten und Gesamtwerten.

### `src/formteile`
Formteil-Metadaten, Parameter, Bilder, Excel-Referenzen und spätere Formelmodule.

### `src/pdf`
Professionelle PDF-Erzeugung mit festen Seiten, Tabellen und automatischen Seitenumbrüchen.

### `src/project`
Projektdateien öffnen/speichern, Versionierung und Import/Export.

### `src/ui`
Oberflächenkomponenten, Dialoge, Tabellen und Bedienlogik.
