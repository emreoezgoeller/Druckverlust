# Druckverlust Pro – Architektur

Version: 0.3.2

## Ziel

Druckverlust Pro soll nicht als einzelne HTML-Datei wachsen, sondern als modulare Fachsoftware.
Die Berechnung muss unabhängig von der Oberfläche funktionieren.

## Kernmodule

```text
ProjectSchema
  verwaltet Projektdateien und Migrationen

CalculationEngine
  berechnet Kanal, Rohr, Formteile, Sonderbauteile und Gesamtdruckverlust

FormPartRegistry
  verwaltet Formteilbibliothek, Kategorien, Bilder und Parameter

PdfEngine
  erzeugt den technischen PDF-Bericht

StorageEngine
  speichert und öffnet .dp-Projektdateien
```

## Datenfluss

```text
Benutzeroberfläche
  ↓
Projektmodell (.dp)
  ↓
CalculationEngine
  ↓
Ergebnisdaten
  ↓            ↓
UI            PDF
```

## Grundregel

Die Oberfläche darf keine eigene Berechnung enthalten. Alle Berechnungen müssen langfristig in der CalculationEngine liegen.
