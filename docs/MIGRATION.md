# Projektdateien und Rückwärtskompatibilität – Schema 1.3.0

Druckverlust Pro 2.12.0 öffnet aktuelle Projektdateien mit Schema **1.3.0** sowie ältere `.dvp`-Stände. Unterstützt werden unter anderem frühere Druckverlust-Pro-Hüllen, rohe Projektobjekte mit `systems`, historische Wrapper wie `projectData` und ältere deutsche Feldnamen wie `anlagen`, `teilstrecken`, `formteile` und `sonderbauteile`.

## Sicherer Ablauf beim Öffnen

1. Die Datei wird zuerst gelesen und auf Dateityp, JSON-Struktur und Schema geprüft.
2. Ist eine Migration nötig, wird vor der Übernahme eine unveränderte Kopie mit dem Namen `*_Original-vor-Migration.dvp` erstellt.
3. Erst danach werden ältere Feldstrukturen auf das aktuelle Datenmodell übertragen.
4. Das Öffnungsprotokoll zeigt Quell- und Zielschema, ergänzte Werte sowie erhaltene oder gelöste Zuordnungen.
5. Das migrierte Projekt sollte kontrolliert und einmal neu gespeichert werden.

Die Originaldatei wird niemals überschrieben. Das Speichern erzeugt immer eine neue `.dvp`-Datei im aktuellen Schema.

## Automatisch ergänzte Werte

- Fehlt die Rauigkeit einer Teilstrecke, wird `k = 0,15 mm` eingesetzt.
- Historische Kanal- oder Rohrmasse ab 10 werden als Millimeter erkannt und in Meter umgerechnet.
- Fehlen SIA-Raumnutzung oder Betriebsart, werden keine Normwerte geraten. Die Geschwindigkeitsprüfung bleibt für diese Anlage „nicht konfiguriert“.
- Ungültige SIA-Codes oder Betriebsarten werden deaktiviert und im Protokoll gemeldet.

## Zuordnungen und IDs

- Numerische IDs werden verlustfrei in Text-IDs umgewandelt.
- Gültige `sectionId`, `transitionOtherSectionId`, `throughSectionId` und `branchSectionId` bleiben erhalten.
- Gültige Sonderbauteilzuordnungen bleiben erhalten.
- Ungültige Verweise auf nicht vorhandene Teilstrecken werden geleert und ausdrücklich gemeldet.
- Doppelte IDs werden eindeutig gemacht; bestehende eindeutig auflösbare Verweise bleiben auf ihrer ursprünglichen ID.

## Verständliche Dateifehler

Die Anwendung unterscheidet unter anderem:

- leere Datei,
- beschädigtes oder abgeschnittenes JSON,
- falscher Dateityp,
- fehlender Projektinhalt,
- ungewöhnlich grosse Datei,
- Projektdatei aus einer neueren, nicht unterstützten Schemaversion.

Jede Meldung enthält eine kurze Erklärung und, soweit möglich, eine Empfehlung zur Wiederherstellung.

## Empfohlene Kontrolle nach einer Migration

1. Projektnummer, Objekt und Anlagen prüfen.
2. SIA-Raumnutzung und Betriebsart je Anlage auswählen oder kontrollieren.
3. Teilstreckenabmessungen, Rauigkeit und Luftmengen stichprobenartig prüfen.
4. Formteil- und Sonderbauteilzuordnungen kontrollieren.
5. Projekt neu berechnen und Datei-QS öffnen.
6. Unter einem neuen Namen als `.dvp` speichern und erneut öffnen.
