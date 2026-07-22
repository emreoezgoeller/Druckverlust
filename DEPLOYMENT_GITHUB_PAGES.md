# Druckverlust Pro auf GitHub Pages veröffentlichen

**Release:** Version 3.0.2 · Phase 58.20  
**Zieladresse:** `https://emreoezgoeller.github.io/Druckverlust/`

## 1. Richtiges Paket verwenden

Für die Veröffentlichung das erzeugte Paket `Druckverlust_Pro_3_0_2_GitHub_Pages.zip` verwenden. Den Inhalt direkt in den Stamm des Repositorys `Druckverlust` kopieren.

Die folgenden Dateien müssen im Repository-Stamm liegen:

```text
index.html
app.html
bedienungsanleitung.html
deployment.html
.nojekyll
release.json
release-integrity.json
assets/
src/
```

Nicht noch einen zusätzlichen Ordner um diese Dateien legen. Sonst würde die Startseite beispielsweise unter `/Druckverlust/Druckverlust_Pro_3_0_2_GitHub_Pages/` landen.

## 2. GitHub Pages aktivieren

1. Repository `Druckverlust` öffnen.
2. `Settings` wählen.
3. Links `Pages` öffnen.
4. Unter `Build and deployment` die Veröffentlichung aus einem Branch wählen.
5. Den verwendeten Branch, normalerweise `main`, und den Ordner `/ (root)` auswählen.
6. Speichern und warten, bis GitHub die Veröffentlichung bestätigt.

## 3. Online-Abnahme

Nach der Veröffentlichung nacheinander öffnen:

```text
https://emreoezgoeller.github.io/Druckverlust/
https://emreoezgoeller.github.io/Druckverlust/deployment.html
https://emreoezgoeller.github.io/Druckverlust/app.html?demo=1
https://emreoezgoeller.github.io/Druckverlust/bedienungsanleitung.html
```

Auf `deployment.html` die Prüfung starten. Erwartet werden:

- GitHub Pages erkannt,
- Projektpfad `/Druckverlust/` korrekt,
- HTTPS aktiv,
- Version 3.0.2 und Phase 58.20 konsistent,
- alle Pflichtdateien erreichbar,
- Integritätsmanifest passend zum Release.

## 4. Browsercache nach einem Update

Jeder Release erhält eine neue Cachekennung. Falls trotzdem ein alter Stand erscheint:

1. Seite mit `Ctrl + F5` neu laden.
2. Alternativ Browsercache für die Seite leeren.
3. Auf `deployment.html` kontrollieren, ob `src/main.js?v=58.20` erkannt wird.

## 5. Projektdaten und Datenschutz

GitHub Pages stellt nur die statischen Programmdateien bereit. Projektinhalte werden nicht automatisch zu GitHub übertragen. Arbeitsstände bleiben im Browser beziehungsweise in exportierten Dateien:

- `.dvp` für den normalen Projektstand,
- `.dvpa` für das Archiv,
- `.dvph` für die dokumentierte Übergabe.

## 6. Fehlerbilder

### Startseite zeigt 404

Prüfen, ob `index.html` wirklich im Repository-Stamm liegt und GitHub Pages aus `/ (root)` veröffentlicht.

### Tool öffnet, aber CSS oder Module fehlen

Die Ordner `src/` und `assets/` müssen vollständig hochgeladen sein. `.nojekyll` darf nicht fehlen.

### Pfadprüfung meldet Fehler

Die veröffentlichte Adresse muss zum Repositorynamen passen: `/Druckverlust/`. Bei einer Umbenennung des Repositorys müssen `deployment-config.json`, `src/core/deploymentConfig.js`, Canonical-Links, Sitemap und 404-Basis gemeinsam angepasst werden.

### Neuer Stand wird nicht angezeigt

Zuerst `Ctrl + F5` verwenden. Danach auf `deployment.html` Version und Cachekennung prüfen.
