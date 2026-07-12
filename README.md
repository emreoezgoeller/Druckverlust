# Druckverlust Pro

Aktueller Entwicklungsstand: **Phase 21.11 – Beta-Feedback-Auswertung und priorisierte Fehlerliste**.

Die öffentliche Startseite ist die Produkt-/Landingpage. Das Berechnungstool ist unter `app.html` erreichbar. Zusätzlich ist eine vorbereitete Lizenz-/Produktübersicht unter `lizenz.html` vorhanden. Enthalten sind Projektangaben, Teilstrecken, Formteile, Sonderbauteile, automatische Berechnung, Bericht, Autosicherung, Projektcheck, Rechen-QS, robuste `.dvp`-Projektdateien, Demo-Projekt, PDF-/Berichtsexport, integrierte Bedienungsanleitung sowie vorbereitete Kontakt-/Rechtseiten, Sitemap, Robots-Datei, 404-Seite und Web-App-Metadaten.







### Phase 21.11 – Beta-Feedback-Auswertung und Fehlerliste

Mehrere aus `feedback.html` oder dem Tool exportierte JSON-Rückmeldungen können unter **Rechen-QS → Feedback-Auswertung** gemeinsam importiert werden. Die Liste priorisiert Blocker und hohe Meldungen, erkennt mögliche Duplikate und führt pro Eintrag Status, Verantwortliche, Zielversion und interne Notizen.

Aufrufmöglichkeiten:

- Tool: **Rechen-QS → Feedback-Auswertung**
- Direkt: `app.html?feedback-auswertung=1`
- Browser-Test: `tests/phase21-beta-feedback-inbox.html`
- Konsole: `npm run test:beta-feedback-inbox`

Die gesamte Auswertung bleibt lokal im Browser und kann als JSON oder CSV exportiert werden. Einzelne Rückmeldungen lassen sich zusätzlich als vorbereiteter Issue-Text kopieren. Der automatische Beta-Teststand umfasst jetzt **11 Prüfserien und 443 dokumentierte Einzelprüfungen**.

### Phase 21.10 – Beta-Feedback und Fehlererfassung

Beta-Tester können Auffälligkeiten, Rechenabweichungen und Funktionswünsche im Tool oder über `feedback.html` strukturiert erfassen. Die Rückmeldung bleibt lokal und kann als JSON, TXT oder CSV exportiert werden.

### Phase 21.09 – Öffentliche Beta-Testversion und konsolidierter Freigabestand

Die öffentliche Testversion besitzt jetzt eine eigene kompakte Seite unter `beta.html`. Sie erklärt den Testablauf, bekannte Grenzen und führt direkt zu Demo, Fachtest-Protokoll und Beta-Status.

Im Tool bündelt **Rechen-QS → Beta-Freigabestand**:

- 9 automatisierte Prüfserien mit 396 dokumentierten Einzelprüfungen,
- 87 zusätzliche Strukturprüfungen der Formteilbibliothek,
- reale Fachtest-Rückmeldungen,
- die formelle Freigabeentscheidung,
- offene Korrekturmassnahmen und Nachtests,
- eine achtteilige Deployment-/Veröffentlichungscheckliste.

Der Beta-Stand kann lokal dokumentiert und als Text, JSON oder CSV exportiert werden. Direkter Aufruf: `app.html?beta=1`. Browser-Test: `tests/phase21-beta-release.html`. Konsolentest: `npm run test:beta-release`.

### Phase 21.08 – Fachliche Freigabeentscheidung und Korrekturplan

Die gebündelte Fachtest-Auswertung kann jetzt in ein formelles Freigabeprotokoll überführt werden. Dokumentiert werden Entscheidung, freigebende Person, Datum, Zielversion, Freigabevermerk sowie konkrete Korrektur- und Nachtestmassnahmen.

Je offenem Prüfpunkt lassen sich Priorität, Status, Verantwortliche, Termin, Korrekturmassnahme und Nachtestergebnis festhalten. Die Daten bleiben lokal im Browser und können als Text, JSON oder CSV exportiert werden.

Aufrufmöglichkeiten:

- Tool: **Rechen-QS → Freigabeentscheidung**
- Fachtest-Auswertung: **Freigabe dokumentieren**
- Direkt: `app.html?freigabe=1`
- Browser-Test: `tests/phase21-release-decision.html`
- Konsole: `npm run test:release-decision`

### Phase 21.07 – Fachtest-Runde und Freigabeauswertung

Fachtester können ihr ausgefülltes Protokoll neu als **JSON für Auswertung** exportieren. Mehrere dieser Dateien lassen sich im Tool unter **Rechen-QS → Fachtest-Auswertung** zusammenführen. Die Auswertung zeigt Testerzahl, Vollständigkeit, Fehler, Auffälligkeiten, offene Prüfpunkte und die abgegebenen Freigabeempfehlungen.

Die Rückmeldungen bleiben lokal im Browser. Eine abgeleitete Entscheidungshilfe markiert den Stand als **Freigabe vorbereitet**, **mit Hinweisen prüfen**, **Nachtest erforderlich** oder **blockiert**. Die gebündelte Auswertung kann als Text kopiert oder als CSV heruntergeladen werden.

Aufrufmöglichkeiten:

- Tool: **Rechen-QS → Fachtest-Auswertung**
- Fachtester-Protokoll: **Fachtest-Runde auswerten**
- Browser-Test: `tests/phase21-feedback-round.html`
- Konsole: `npm run test:feedback-round`

### Phase 21.06 – Einheitliches Oberflächendesign

Die Oberfläche des Berechnungstools verwendet jetzt dieselbe visuelle Sprache wie die Hauptseite: helle Glas-Navigation, blaue Verlaufsschaltflächen für Hauptaktionen, schwebende Karten, abgerundete Eingabefelder und ruhigere Tabellen. Der Markenbereich mit EO-Logo, **Druckverlust Pro** und **Professional** bleibt unverändert sichtbar. Die Anpassung ist rein gestalterisch; Rechenlogik, Projektdateien, Formteile und Berichte wurden nicht verändert.

### Phase 21.05 – Öffentliche Fachtest-Version

Für die externe Fachtest-Runde steht jetzt ein strukturiertes Protokoll direkt im Tool bereit. Der Fachtest kombiniert den automatischen Vorabcheck mit **5 Prüfserien und 329 Einzelprüfungen** sowie **10 manuellen Praxisschritten** für Projekt, Teilstrecken, Formteile, Sonderbauteile, `.dvp`, Bericht/PDF und Bedienung.

Aufrufmöglichkeiten:

- Produktseite/Footer: **Fachtest**
- Direkt: `app.html?fachtest=1`
- Tool: **Rechen-QS → Fachtest-Protokoll**
- Browser-Test: `tests/phase21-expert-test-protocol.html`
- Konsole: `npm run test:expert`

Testerangaben, Bewertungen und Bemerkungen werden lokal im Browser zwischengespeichert. Das vollständige Protokoll kann als Text kopiert oder als TXT/CSV heruntergeladen werden. Es findet noch keine automatische Übermittlung an einen Server statt.

### Phase 21.04 – Fachliche Vergleichsmatrix und Handrechnungen

Zehn feste Handrechnungen prüfen den Rechenkern jetzt über eine transparente Vergleichsmatrix. Abgedeckt sind Rechteckkanäle, Rundrohre, unterschiedliche Luftdichten und Reibungszahlen sowie eine komplette Systemsumme mit ζ-Formteilen, Direktverlust und Sonderbauteil. Insgesamt werden **92 Einzelprüfungen** ausgeführt.

Aufrufmöglichkeiten:

- Tool: **Rechen-QS → Vergleichsmatrix**
- Browser: `tests/phase21-comparison-matrix.html`
- Konsole: `npm run test:comparison`

Die Sollwerte sind fest hinterlegte Handrechnungen und werden nicht aus dem aktuellen Rechenkern erzeugt. Die Matrix ist eine fachliche Regressions- und Plausibilitätsprüfung, jedoch keine externe Normenzertifizierung.


### Phase 21.03 – Formteil-Grössen- und Anschluss-Synchronisation

Die automatische Grössen- und Anschlussübernahme ist jetzt für **alle 14 Formteile** automatisiert abgesichert. **15 Testfälle mit 113 Einzelprüfungen** prüfen Hauptgrössen, Übergangsseiten, Durchgang `AD/WD`, Abzweig `AA/WA`, manuelle Overrides und die automatische Nachführung bei Änderungen an einer Anschluss-Teilstrecke.

Aufrufmöglichkeiten:

- Tool: **Rechen-QS → Formteil-Sync-QS**
- Browser: `tests/phase21-formpart-sync.html`
- Konsole: `npm run test:sync`

Dabei wurde die Anschlusslogik fachlich bereinigt: T-Abzweig rund 1/2 erhalten jetzt die Durchgangszuordnung; wirkungslose Anschlussauswahlen werden nicht mehr angezeigt.

### Phase 21.02 – Praxisprojekt, Speicher-Roundtrip und Berichtstest

Ein deterministisches Grossprojekt prüft jetzt den kompletten Ablauf mit **48 Teilstrecken, 36 Formteilen und 26 Sonderbauteilen**. Der automatische Test kontrolliert Berechnung, Zuordnungen, `.dvp`-Speichern/Öffnen sowie einen **20-seitigen Bericht**. Er ist im Tool unter **Rechen-QS → Praxisprojekt-QS**, im Browser unter `tests/phase21-practice-project.html` und über `npm run test:practice` erreichbar.

Der Test deckt bewusst Projekte mit mehr als 42 Teilstrecken ab. Das Praxisprojekt ist ein technischer Belastungstest und keine reale projektspezifische Auslegung.

### Phase 21.01 – Formteilbibliothek und Excel-Referenzprüfung

Alle 14 Formteile sind jetzt strukturell geprüft. 18 feste Referenzfälle kontrollieren 56 Tabellen-/Berechnungspunkte gegen die hinterlegten Excel-Vorlagen. Der Test ist im Tool unter **Rechen-QS → Formteil-QS**, im Browser unter `tests/phase21-formpart-validation.html` und über `npm run test:formparts` erreichbar.

Wichtig: Die Referenztests sichern die aus den Projekt-Exceldateien übernommenen Werte und Suchregeln ab. Sie sind keine externe Normenzertifizierung.

### Phase 20.00 – Lizenz-/Abo-Vorbereitung

Der Lizenzstatus ist jetzt sichtbarer vorbereitet: Produktseite, Lizenzseite, Tool-Hilfe und Info-Dialog zeigen den Modus **Professional Preview**. Zahlung, Login und Zugriffssperre bleiben weiterhin deaktiviert.

### Phase 19.11 – Deployment-Feinschliff, Sitemap und App-Metadaten

Für die öffentliche GitHub-Pages-Bereitstellung wurden `site.webmanifest`, `robots.txt`, `sitemap.xml` und eine eigene `404.html` ergänzt. Produkt-, Tool- und Rechtseiten verweisen auf das Manifest; diese Deployment-Stufe wurde damals mit Cache-Version `20.01` abgeschlossen.

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
- Die aktuelle Cache-Version ist `21.11`.
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


## Phase 21.00 – automatische Referenztests

Der Rechenkern wird jetzt mit festen Sollwerten abgesichert. Die Tests prüfen:

- Rechteckkanal und Rundrohr
- Geschwindigkeit, dynamischen Druck und Reibungsverlust
- ζ-Verluste
- direkte Formteilverluste und Sonderbauteile
- Summenbildung und Rundung auf 0.5 Pa
- Dezimalkomma und Typ-Erkennung
- den bestehenden Excel-Vergleich `TEST-001`

Ausführung:

```bash
npm test
```

Alternativ kann `tests/phase21-reference-tests.html` im Browser geöffnet werden. Im Tool sind die Ergebnisse unter **Rechen-QS → Referenztests** sichtbar.

Die Referenztests schützen den Rechenkern gegen unbeabsichtigte Änderungen. Die vollständige Einzelvalidierung aller Formteilkennwerte folgt separat.
