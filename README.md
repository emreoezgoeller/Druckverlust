# Druckverlust Pro

Aktueller Entwicklungsstand: **Phase 18.33**.

Die professionelle Oberfläche ist aktiv. Enthalten sind Projektangaben, Teilstrecken, Formteile, Sonderbauteile, automatische Berechnung, Bericht, Autosicherung, Projektcheck, Deployment-QS, Versions-/Update-Prüfung, automatische Formteil-Grössenübernahme, Teilstrecken-Schnellerfassung, PDF-/Berichts-QS, transparente Druckverlust-Aufteilung, Rechen-QS und neu eine robuste **.dvp-Projektdatei-QS** und eine klarere Bedienführung mit Pflichtfeld-Hinweisen.

## Wichtige Hinweise

- Für GitHub Pages nach dem Hochladen kurz warten und dann mit **Ctrl + F5** neu laden.
- Die aktuelle Cache-Version ist `18.33`.
- Über den Ribbon-Button **Datei-QS** können Speichern, Öffnen, Dateiname, IDs, Zuordnungen und Import-Stabilität geprüft werden.
- Über den Ribbon-Button **Rechen-QS** können Summen, p_dyn, Geschwindigkeit, Reibung und Rundung geprüft werden.
- Über den Ribbon-Button **Info** kann der aktive Stand direkt in der App geprüft werden.
- Bilder sind gegen Rechtsklick, Ziehen und Markieren geschützt.

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
