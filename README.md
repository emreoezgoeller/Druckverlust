# Druckverlust Pro

Aktueller Entwicklungsstand: **Phase 19.01 Produktseite / App-Trennung**.

Die öffentliche Startseite ist jetzt die Produkt-/Landingpage. Das eigentliche Berechnungstool ist unter `app.html` erreichbar. Enthalten sind Projektangaben, Teilstrecken, Formteile, Sonderbauteile, automatische Berechnung, Bericht, Autosicherung, Projektcheck, Rechen-QS, robuste `.dvp`-Projektdateien, Demo-Projekt und PDF-/Berichtsexport.

## Wichtige Hinweise

- Für GitHub Pages nach dem Hochladen kurz warten und dann mit **Ctrl + F5** neu laden.
- Die aktuelle Cache-Version ist `19.01`.
- Über den Ribbon-Button **Datei-QS** können Speichern, Öffnen, Dateiname, IDs, Zuordnungen und Import-Stabilität geprüft werden.
- Über den Ribbon-Button **Rechen-QS** können Summen, p_dyn, Geschwindigkeit, Reibung und Rundung geprüft werden.
- Über den Ribbon-Button **Info** kann der aktive Stand direkt in der App geprüft werden.
- Über den Ribbon-Button **RC prüfen** läuft die finale Schlussprüfung für den internen Teststand.
- Bilder sind gegen Rechtsklick, Ziehen und Markieren geschützt.



## Phase 19.01 – Produktseite als Startseite

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
