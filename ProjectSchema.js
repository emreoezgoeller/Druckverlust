# Architektur – Druckverlust Pro

## Grundsatz
Die Weboberfläche darf nicht die Berechnung enthalten. Die Berechnung liegt in unabhängigen Engines.

## Module

### CalculationEngine
Berechnet Kanal, Rohr, Formteile, Sonderbauteile und Gesamtdruckverlust.

### ProjectSchema
Definiert das `.dp` Projektformat.

### FormPartRegistry
Verwaltet Formteile, Kategorien, Bilder, Parameter und später die Excel-validierten Formeln.

### StorageEngine
Speichert und öffnet Projekte als `.dp` Datei.

### PdfReportEngine
Erzeugt künftig den professionellen PDF-Bericht aus dem Datenmodell.

## Ziel
Die aktuelle Oberfläche bleibt bedienbar. Die Module werden schrittweise angeschlossen.
