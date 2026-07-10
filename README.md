# Druckverlust Pro

Aktueller Entwicklungsstand: **Phase 19.00 Produktseite**.

Die professionelle Oberfläche ist aktiv. Enthalten sind Projektangaben, Teilstrecken, Formteile, Sonderbauteile, automatische Berechnung, Bericht, Autosicherung, Projektcheck, Deployment-QS, Versions-/Update-Prüfung, automatische Formteil-Grössenübernahme, Teilstrecken-Schnellerfassung, PDF-/Berichts-QS, transparente Druckverlust-Aufteilung, Rechen-QS, robuste **.dvp-Projektdatei-QS**, Bedienführung mit Pflichtfeld-Hinweisen und Demo-Projekt für Vorführung und QS sowie die finale Release-Candidate-Schlussprüfung.

## Wichtige Hinweise

- Für GitHub Pages nach dem Hochladen kurz warten und dann mit **Ctrl + F5** neu laden.
- Die aktuelle Cache-Version ist `19.00`.
- Über den Ribbon-Button **Rechen-QS** können Summen, p_dyn, Geschwindigkeit, Reibung und Rundung geprüft werden.
- Interne QS-Module für Datei, Deployment und Release-Candidate bleiben im Code erhalten, sind aber im Ribbon ausgeblendet.
- Über den Ribbon-Button **Info** kann der aktive Stand direkt in der App geprüft werden.
- Bilder sind gegen Rechtsklick, Ziehen und Markieren geschützt.



## Phase 19.00 – Produktseite

Mit Phase 19.00 wurde eine separate Produkt-/Landingpage ergänzt:

- `produkt.html` = Produktauftritt für Präsentation, Vertrieb und spätere Webseite
- `index.html` = bleibt weiterhin die direkte Druckverlust-Pro-Anwendung

Damit kann der Produktauftritt vorbereitet werden, ohne den bestehenden Tool-Link auf GitHub Pages zu brechen.

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
