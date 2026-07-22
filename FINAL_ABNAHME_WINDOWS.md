# Druckverlust Pro 3.0 – Windows-Finalabnahme

**Version:** 3.0.2 · Phase 58.20  
**Zweck:** Letzte visuelle Druckkontrolle unter Google Chrome und Microsoft Edge.

## Vorbereitung

1. `Druckverlust_starten.bat` ausführen.
2. Ein reales Projekt oder das Demo-Projekt öffnen.
3. Projekt vollständig berechnen.
4. Im Ribbon **Bericht** öffnen.

## Prüfung in Google Chrome

1. Bericht über **Drucken / PDF** öffnen.
2. Papierformat **A4** kontrollieren.
3. Skalierung auf **100 %** beziehungsweise **Standard** belassen.
4. Kopf- und Fusszeilen des Browsers deaktivieren.
5. Folgende Punkte prüfen:
   - weisses Deckblatt und Logo-Wasserzeichen vollständig,
   - Inhaltsverzeichnis und Seitennummern korrekt,
   - keine abgeschnittenen Tabellen oder Spalten,
   - Teilstrecken und Formteile vollständig auf Fortsetzungsseiten,
   - Anlagenschema ohne Überlagerungen,
   - letzte Berichtseite vollständig.
6. Eine PDF-Datei speichern und öffnen.
7. Im Ribbon **Finalprüfung** öffnen und **Druck in Google Chrome bestätigen** anklicken.

## Prüfung in Microsoft Edge

Die gleichen Schritte in Microsoft Edge wiederholen. Danach in der Finalprüfung **Druck in Microsoft Edge bestätigen** anklicken.

## Freigabestatus

Die Finalprüfung zeigt erst **Finalfreigabe bereit**, wenn:

- keine roten technischen Prüfpunkte vorhanden sind,
- Integritätsmanifest, `deployment.html` und Deployment-QS ohne Fehler sind,
- Chrome- und Edge-Druckabnahme bestätigt wurden,
- das Projekt keine ungespeicherten Änderungen enthält.

Die Browserbestätigungen werden nur lokal im jeweiligen Browserprofil gespeichert. Sie verändern keine `.dvp`-Projektdatei.
