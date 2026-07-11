# Druckverlust Pro

Aktueller Entwicklungsstand: **Phase 20.01 Lizenzstatus im Tool vorbereitet**.

Die öffentliche Startseite ist die Produkt-/Landingpage. Das Berechnungstool ist unter `app.html` erreichbar. Zusätzlich ist eine vorbereitete Lizenz-/Produktübersicht unter `lizenz.html` vorhanden. Enthalten sind Projektangaben, Teilstrecken, Formteile, Sonderbauteile, automatische Berechnung, Bericht, Autosicherung, Projektcheck, Rechen-QS, robuste `.dvp`-Projektdateien, Demo-Projekt, PDF-/Berichtsexport, integrierte Bedienungsanleitung sowie vorbereitete Kontakt-/Rechtseiten, Sitemap, Robots-Datei, 404-Seite und Web-App-Metadaten.

### Phase 20.00 – Lizenz-/Abo-Vorbereitung

Der Lizenzstatus ist jetzt sichtbarer vorbereitet: Produktseite, Lizenzseite, Tool-Hilfe und Info-Dialog zeigen den Modus **Professional Preview**. Zahlung, Login und Zugriffssperre bleiben weiterhin deaktiviert.

### Phase 19.11 – Deployment-Feinschliff, Sitemap und App-Metadaten

Für die öffentliche GitHub-Pages-Bereitstellung wurden `site.webmanifest`, `robots.txt`, `sitemap.xml` und eine eigene `404.html` ergänzt. Produkt-, Tool- und Rechtseiten verweisen jetzt auf das Manifest und tragen die aktuelle Cache-Version `20.01`.

### Phase 19.09 – Kontakt und Rechtliches vorbereitet

Die Produktseite enthält jetzt einen kompakten Kontakt-/Feedbackbereich. Zusätzlich wurden `impressum.html` und `datenschutz.html` als vorbereitete Platzhalter ergänzt. Die finalen Pflichtangaben müssen vor einer offiziellen Veröffentlichung geprüft und ergänzt werden.

### Phase 19.06 – integrierte Bedienungsanleitung

Der Ribbon-Button **Hilfe** öffnet jetzt eine eigene Hilfeseite im Arbeitsbereich. Die Anleitung erklärt kurz Projektangaben, Teilstrecken, Formteile, Sonderbauteile, QS, Bericht/PDF und wichtige Kurzbefehle. Von der Produktseite kann die Hilfe direkt über `app.html?help=1` geöffnet werden.

### Phase 19.05 – Footer-Copyright Produktseite

Der Footer der Produktseite zeigt jetzt links den gewünschten Copyright-Hinweis: `© 2026 Emre Özgöller – Druckverlust Pro · Professional`.

### Phase 19.04 – Produktseite Feinschliff

Die Hauptseite wurde um einen kompakten Nutzenstreifen und einen Abschluss-CTA ergänzt. Damit sieht die Produktseite professioneller aus, bleibt aber bewusst kurz und übersichtlich.


### Phase 19.03 – Demo-Start von der Hauptseite

Die Produktseite kann das Berechnungstool jetzt direkt mit dem Demo-Projekt öffnen (`app.html?demo=1`).

## Wichtige Hinweise

- Für GitHub Pages nach dem Hochladen kurz warten und dann mit **Ctrl + F5** neu laden.
- Die aktuelle Cache-Version ist `20.01`.
- Interne Datei-QS bleibt im Code verfügbar, ist aber in der Hauptnavigation ausgeblendet.
- Über den Ribbon-Button **Rechen-QS** können Summen, p_dyn, Geschwindigkeit, Reibung und Rundung geprüft werden.
- Über den Ribbon-Button **Info** kann der aktive Stand direkt in der App geprüft werden.
- Interne RC- und Deployment-QS bleiben im Code verfügbar, sind aber in der Hauptnavigation ausgeblendet.
- Bilder sind gegen Rechtsklick, Ziehen und Markieren geschützt.



## Phase 19.02 – Produktseite als Startseite

- `index.html` ist jetzt die Produkt-/Landingpage für GitHub Pages.
- Das Berechnungstool liegt neu unter `app.html`.
- Der Button **Tool starten** führt von der Produktseite zum Berechnungstool.
- `produkt.html` bleibt als Alias erhalten, damit bestehende Links nicht ins Leere laufen.

## Phase 18.35a – Ribbon-QS-Schaltflächen ausgeblendet

Die internen QS-Schaltflächen **Datei-QS**, **Deploy prüfen** und **RC prüfen** wurden aus dem sichtbaren Ribbon entfernt, damit die Bedienoberfläche ruhiger wirkt. Die Diagnosemodule bleiben im Projekt erhalten und können später bei Bedarf wieder aktiviert werden.

## Phase 18.35 – Release Candidate / Schlussprüfung

- Neuer Ribbon-Button **RC prüfen** ergänzt.
- Der RC-Check fasst Projektcheck, Rechen-QS, Datei-QS, Berichtmodell, Demo-Projekt, Speicherbarkeit und Deployment-QS zusammen.
- Ergebnis wird als klare Ampel angezeigt: **RC bereit**, **RC mit Hinweisen** oder **RC blockiert**.
- Das RC-Protokoll kann kopiert und als Übergabe-/Testnotiz verwendet werden.
- Diese Phase schliesst die technische Grundsystem-Stabilisierung von Phase 18 ab.


## Phase 18.34 – Demo-Projekt und Vorführmodus

- Neuer Ribbon-Button **Demo** lädt ein vollständiges Beispielprojekt.
- Das Demo-Projekt enthält Projektangaben, 5 Teilstrecken, Formteile und Sonderbauteile.
- Das Beispiel eignet sich für Vorführung, Rechen-QS, Datei-QS, Deploy-QS und Berichtstest.
- Beim Laden des Demo-Projekts werden ungespeicherte Änderungen vorher abgefragt.

## Phase 18.33 – Bedienführung und Oberfläche polieren

- Projekt- und Anlagenübersicht zeigen eine neue Schrittführung: Projektangaben → Teilstrecken → Formteile → QS → Bericht.
- Offene Pflichtfelder werden direkt im Projektformular markiert.
- Über **Start** oder **Alt + Home** gelangt man schnell zurück zur zentralen Übersicht.
- Statusbar und Hilfe wurden für Rechen-QS, Datei-QS und Startnavigation nachgezogen.

## Phase 18.32 – Projektdatei-QS und .dvp-Stabilisierung

- `.dvp`-Speicherung erhält ein klares Dateiformat mit Schema-Version, App-Version, Exportzeitpunkt und Projektzusammenfassung.
- Öffnen von Projektdateien ist robuster: ältere Rohprojekt-Dateien werden erkannt und normalisiert.
- Fehlermeldungen beim Öffnen sind verständlicher.
- Projektstruktur wird beim Speichern/Öffnen stabilisiert: IDs, Anlagen, Teilstrecken, Formteile, Sonderbauteile, Metadaten und Berichtsdaten.
- Neuer Ribbon-Button **Datei-QS** mit Detailseite und kopierbarer Zusammenfassung.
- Projekt- und Anlagenübersicht zeigen einen kompakten Datei-QS-Block.

## Phase 18.31 – Rechen-QS und fachlicher Nachweis

- Neuer Ribbon-Button **Rechen-QS**.
- Rechenprüfung für Summenbildung: Reibung + Formteile + Sonderbauteile = Gesamtdruckverlust.
- Kontrolle von Geschwindigkeit, dynamischem Druck `p_dyn = ρ/2 × v²` und Reibungsverlust `R × Länge`.
- Detailseite mit Fehlern, Hinweisen, OK-Punkten und kopierbarer QS-Zusammenfassung.
- Kompakter Rechen-QS-Block direkt in der Anlagenübersicht.

## Phase 18.29 – Formteilbibliothek & Auswahl-Assistent

Die Formteil-Auswahl wurde erweitert. Sie zeigt nun eine Bibliotheks-QS, fachliche Kategorien, Kompatibilität zur aktiven Teilstrecke und Schnellfilter für passende Formteile, α/β-Auswahl sowie Grössen-/Anschluss-Sync. Damit wird die Auswahl sicherer und die Eingabefehler werden weiter reduziert.

- Formteilkarten zeigen Beschreibung, Bildstatus und Sync-Fähigkeiten.
- Kategorien sind fachlicher gruppiert und verständlicher beschriftet.
- α-/β-Werte bleiben Dropdown-Auswahlwerte statt freie Eingabe.
- Der aktive Teilstreckenbezug wird direkt im Picker angezeigt.


## Phase 19.02

- Kurzanleitung auf der Hauptseite: Projekt → Teilstrecken → Formteile → Bericht.
- Tool bleibt unter `app.html`, Produktseite bleibt `index.html`.


## Phase 19.08 – Professional-/Trust-Bereich

Die Produktseite zeigt jetzt zusätzlich, wofür das Tool gedacht ist: Lüftungsplanung, Kontrolle und Abgabe. Ergänzt wurde ein kurzer Transparenzhinweis zur lokalen Projektdatei `.dvp` sowie ein kompakter Footer mit Tool-, Anleitung- und Demo-Links.

## Phase 19.07 – Bedienung, Demo und Beispielnachweis

Die Produktseite kann jetzt nicht nur das Demo-Projekt öffnen, sondern auch direkt den Beispielbericht starten:

- `app.html?demo=1` lädt das Demo-Projekt.
- `app.html?demo=1&report=1` lädt das Demo-Projekt und öffnet direkt den Bericht.
- `app.html?help=1` öffnet direkt die integrierte Bedienungsanleitung.

Die Hilfeseite enthält zusätzlich Beispielwerte und eine kurze Erklärung der Druckverlust-Aufteilung.

## Phase 20.02

Lizenzmatrix und Feature-Flags sind vorbereitet. Zahlung, Login und Zugriffssperre sind weiterhin deaktiviert.


## Phase 20.03

Lizenz-Gate und Exportstatus sind zentral vorbereitet. Die App bleibt weiterhin ohne Login, Zahlung oder Zugriffssperre nutzbar. Berichte und QS können den aktuellen Modus **Professional Preview** sowie den vorbereiteten Exportstatus anzeigen.

## Phase 20.04

- Produktseite zeigt den nächsten fachlichen Ausbau kompakt.
- Im Tool sind Roadmap, Feedback-Vorlage und letzte Versionsschritte über Hilfe erreichbar.
- Feedback funktioniert weiterhin ohne Backend: Eine strukturierte Vorlage wird in die Zwischenablage kopiert.
