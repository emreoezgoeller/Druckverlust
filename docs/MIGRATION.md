# Projektdateien und Rückwärtskompatibilität

Druckverlust Pro 2.1 öffnet sowohl aktuelle, umhüllte `.dvp`-Dateien als auch ältere rohe Projektobjekte mit einer `systems`-Liste. Beim Import werden fehlende Listen ergänzt, alte Feldnamen normalisiert, doppelte IDs korrigiert und ungültige Bauteilzuordnungen gelöst.

## Empfohlener Ablauf

1. Ältere Datei zuerst über **Projekt öffnen** prüfen.
2. Hinweise der Importvorschau beachten.
3. Projekt vollständig neu berechnen.
4. Engineering-QS und Anlagenschema kontrollieren.
5. Unter neuem Dateinamen als `.dvp` speichern.

Vor einem Import wird bei den unterstützten Sicherheits- und Übergabeabläufen eine lokale Notfallsicherung erstellt.

## Migration auf 2.1.0 / Schema 1.2.0

Fehlt bei einer älteren Teilstrecke die Rauigkeit, wird automatisch `k = 0,15 mm` ergänzt. Ein alter globaler `lambda`-Wert wird nicht mehr für neue Berechnungen verwendet. Die Reibungszahl wird nach dem Öffnen je Teilstrecke neu berechnet.
