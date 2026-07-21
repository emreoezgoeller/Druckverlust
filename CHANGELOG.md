# Changelog

## 2.6.2 – Phase 51.20 – 21.07.2026

- Anlagenweite Auswahl der Raumnutzung nach SIA 2024:2021 Tabelle 13 und der Betriebsart 1-stufig, 2-stufig oder stufenlos ergänzt.
- Jährliche Elektro-Vollaststunden werden aus der gewählten Kombination automatisch ermittelt.
- Maximale Geschwindigkeitsrichtwerte für Rundrohre nach SIA 382/1:2025 Tabelle 49 je Teilstrecke berechnet.
- Zwischenwerte der Elektro-Vollaststunden zwischen 2’000, 4’000 und 8’000 h/a werden linear interpoliert.
- Rechteckkanäle werden mit dem Reduktionsfaktor aus Tabelle 50 bewertet; Zwischenwerte der Seitenverhältnisse werden interpoliert.
- Seitenverhältnisse ab 1:6 erhalten einen Normhinweis; Werte über 1:10 werden kontrolliert am Tabellenrand 1:10 begrenzt.
- Neue Anlagenübersicht mit Istwert, Rundrohr-Richtwert, Reduktionsfaktor, maximaler Geschwindigkeit und Status aller Teilstrecken.
- Kompakte Einzelprüfung im Teilstreckeneditor sowie Integration in Validierung, Qualitätsübersicht, Speicherung und Professional Report.
- Kritischer-Strang- und Schallhinweis aus dem bereitgestellten Normauszug sichtbar dokumentiert.
- 252 zusätzliche Phase-51.20-Prüfungen für Raumdaten, Tabellenlogik, Interpolation, Speicherung, Bericht und UI ergänzt.

## 2.6.1 – Phase 51.10 – 20.07.2026

- Sechs neue rechteckige Formteile ergänzt: Krümmerabzweig 1/2 jeweils als Abzweig und Durchgang sowie Krümmerendstück 1/2.
- Tabellenwerte und zulässige Geometriefälle direkt aus den sechs bereitgestellten Excel-Referenzen übernommen.
- Excel-Suchlogik umgesetzt: Geometriefall exakt, Geschwindigkeitsverhältnis exakt oder nächst kleinerer Tabellenwert.
- Druckverlustbezug fachgerecht getrennt: Abzweig/Endstück auf `p_dyn(wA)`, Durchgang auf `p_dyn(wD)`.
- Negative ζ-Werte der Zusammenflussvarianten bleiben erhalten und werden nicht künstlich auf 0 begrenzt.
- Haupt-, Durchgangs- und Abzweigabmessungen sowie Luftmengen werden aus den zugeordneten Teilstrecken übernommen; manuelle Zuordnung bleibt möglich.
- Nicht vorhandene Geometriekombinationen werden blockiert und verständlich gemeldet, statt Werte zu interpolieren oder zu erfinden.
- Sechs PNG-Schemata und sechs Excel-Dateien als interne Formteilreferenzen eingebunden.
- Formteilbibliothek auf 21 Typen, Excel-Referenzprüfung auf 25 Fälle / 81 Einzelprüfungen und Synchronisationsprüfung auf 179 Einzelprüfungen erweitert.
- 65 zusätzliche Phase-51.10-Prüfungen für Registry, Tabellenwerte, Bodensuche, negative ζ-Werte, Warnungen und Teilstrecken-Synchronisation ergänzt.

## 2.6.0 – Phase 51.00 – 20.07.2026

- Ribbon auf eine kompakte, einzeilige Plattformleiste mit integriertem Logo und Projektstatus vereinheitlicht.
- Sichtbare zweite Gruppenzeile auf Desktop entfernt, ohne Überlauf-, Sprung- oder Tastaturnavigation zu verlieren.
- Symbol- und Statuslegende für zentrale Werkzeugtypen und Projektzustände ergänzt.
- Zentralen `UiTooltipController` für sofortige Infotexte in Ribbon, Sidebar und Arbeitsbereich ergänzt.
- Horizontales Überragen von Projektbaum, aktiver Auswahl und Arbeitsbereichsinhalten abgesichert.
- Responsive Legenden- und Werkzeugführung für Tablet und Smartphone ergänzt.
- 48 automatisierte Phase-51-Prüfungen ergänzt.

## 2.5.0 – Phase 50.00 – 20.07.2026

- Formteile können direkt aus der aktuell geöffneten Teilstrecke erstellt werden.
- Die Formteilbibliothek zeigt eine änderbare Ziel-Teilstrecke vor der Auswahl.
- Der Formteilarbeitsplatz zeigt die Einbauposition im Kanalstrang mit Vor-/Zurück-Navigation.
- Manuell geänderte Anschluss- und Geometriewerte bleiben beim Wechsel der Teilstrecke geschützt.
- Automatische Werte können bewusst über „Automatik wieder übernehmen“ neu synchronisiert werden.
- Übergänge und Abzweige erhalten bestätigbare Vorschläge für zusätzliche Anschluss-Teilstrecken.
- Ungültige oder widersprüchliche Haupt-/Zusatzzuordnungen werden sichtbar gewarnt und nicht still auf TS 1 umgebogen.
- Formteile werden innerhalb ihrer zugeordneten Teilstrecke sortiert; andere Teilstrecken bleiben unberührt.
- 37 automatisierte Phase-50-Prüfungen ergänzt.

## 2.4.0 – Phase 49.00

- vereinfachte Teilstreckenerfassung mit herstellerneutralem Dimensionierungsassistenten,
- Zielgeschwindigkeiten 2,0 / 3,0 / 4,0 m/s sowie freier Zielwert,
- bis zu vier Standardabmessungen für Rechteckkanal und Rundrohr,
- bewusste Bestätigung vor jeder Geometrieänderung,
- Geometrieeingaben in Millimeter bei unverändertem Meter-Rechenmodell,
- Schnellfunktion für die nächste Teilstrecke mit gleicher Grösse und Länge 0 m,
- 54 automatisierte Phase-49-Prüfungen.

## 2.3.0 – Phase 48.00 – 20.07.2026

- Reihenfolge der Teilstreckenfelder auf **Name → Luftmenge → Rauigkeit → Querschnittstyp → Breite/Höhe bzw. Durchmesser → Länge** angepasst.
- Der Anwendungskontext merkt sich je Anlage die zuletzt erstellte Teilstrecke.
- Neue Formteile werden automatisch dieser zuletzt erstellten Teilstrecke zugeordnet, statt auf die erste Teilstrecke zurückzufallen.
- Manuelle Umzuordnung im Formteileditor bleibt unverändert möglich.
- Sortieren von Teilstrecken verändert die gemerkte Standard-Zuordnung nicht.
- Duplizieren, Löschen, Altprojekt-Laden und Anlagen ohne Teilstrecken besitzen kontrollierte Rückfälle.
- Formteilbibliothek zeigt die tatsächliche Standard-Zuordnung samt Hinweis auf die manuelle Änderbarkeit.
- 22 neue automatisierte Workflow-Prüfungen ergänzt.

## 2.2.0 – Phase 47.00 – 20.07.2026

- Neues herstellerneutrales Formteil **„Freier ζ-Wert“** ergänzt.
- Als einzigen Fachparameter wird der Widerstandsbeiwert ζ eingegeben.
- Der dynamische Druck wird automatisch aus der zugeordneten Teilstrecke übernommen.
- Der Formteildruckverlust wird live als `Δp = ζ × p_dyn` berechnet und bei Änderungen von Luftmenge oder Dimension automatisch aktualisiert.
- Formteilbibliothek, Bericht, CSV/PDF-Ausgabe, Projektberechnung und Formteil-QS um den neuen Typ erweitert.
- Neutrale Skizze, Excel-Referenz und eigene Phase-47-Prüfungen ergänzt.

## 2.1.0 – Phase 46.00 – 20.07.2026

- Globalen Reibungszahl-Eingabewert aus den Berichtseinstellungen entfernt.
- Absolute Rauigkeit `k` wird jetzt je Teilstrecke geführt; Standardwert für neue und alte Teilstrecken ist 0,15 mm.
- Rauigkeit kann in jeder Teilstrecke und in der Teilstrecken-Schnellerfassung individuell angepasst werden.
- Darcy-Reibungszahl `λ` wird je Teilstrecke automatisch aus Rauigkeit, Reynolds-Zahl und charakteristischem Durchmesser ermittelt.
- Rechteckkanäle verwenden den hydraulischen Durchmesser, Rundrohre den Rohrdurchmesser; dadurch entstehen fachlich getrennte λ-Werte.
- Zugeordnete Formteile übernehmen Rauigkeit, Reynolds-Zahl und λ automatisch von ihrer Teilstrecke; die Formteilberechnung bleibt korrekt über ζ und dynamischen Druck.
- Excel-/CSV-Import, Export, Professional Report, CSV-Bericht, Revisionen und Projektmigration um k, Re und λ erweitert.
- Projektschema auf 1.2.0 und Anwendung auf 2.1.0 angehoben.

## 2.0.0 – Phase 45.00 – 19.07.2026

- Entwicklungsstände 21.12 bis 42.00 zu einem vollständigen Release zusammengeführt.
- Versions-, Cache-, Startseiten-, Manifest- und Dokumentationsstände vereinheitlicht.
- Produkt- und Feedback-Assets auf dauerhafte, phasenunabhängige Dateinamen umgestellt.
- Öffentliche Beta-Seite zur aktuellen Qualitäts- und Testseite überarbeitet.
- Veraltete Phase-21-Browserwrapper entfernt; automatisierte Node-Prüfungen und Fachreferenzen beibehalten.
- Rückwärtskompatibilitätsprüfung für alte rohe und umhüllte `.dvp`-Strukturen ergänzt.
- Lastprüfung für 100 Teilstrecken und Mehranlagen-Projekt mit 200 Teilstrecken ergänzt.
- Release-Manifest, Migration, Release-Checkliste und Release Notes ergänzt.
- Kleine Doppelanweisung in der Projektserialisierung bereinigt.
- Ventilatorauslegung und Hersteller-Bauteildatenbank bleiben ausdrücklich ausgeschlossen.

# CHANGELOG

## Phase 42.00 – Schnellerfassung aus Excel und CSV

- Neue `ProjectTableImportEngine` für Excel-, CSV-, TSV- und Zwischenablage-Daten ergänzt.
- Tabulator, Semikolon und Komma werden automatisch erkannt; deutsche und englische Spaltenüberschriften werden flexibel zugeordnet.
- Zahlen mit Dezimalkomma, Dezimalpunkt und Tausendertrennzeichen sowie Dimensionen in mm, cm und m werden normalisiert.
- Luftmengen in m³/h, m³/s und l/s werden auf m³/h vereinheitlicht.
- Drei kontrollierte Importmodi ergänzt: Teilstrecken ergänzen, nach Bezeichnung aktualisieren oder vollständig ersetzen.
- Prüfvorschau mit Zeilenstatus, geplanten Aktionen, Fehlern und Warnungen ergänzt; fehlerhafte Tabellen können nicht übernommen werden.
- Vor jeder Übernahme wird automatisch eine lokale Sicherheitssicherung erstellt; danach wird die aktive Anlage vollständig neu berechnet.
- Beim Ersetzen werden vorhandene Formteile und Sonderbauteile anhand identischer Teilstreckenbezeichnungen neu zugeordnet; nicht zuordenbare Bauteile bleiben erhalten und werden zur Prüfung markiert.
- CSV-Vorlage, Export der aktiven Anlage und projektbezogener Importnachweis mit Bearbeiter, Vermerk und Änderungsumfang ergänzt.
- Schnellerfassung in Ribbon, Sidebar, Statusleiste, Hilfe-Center, Startseite und Tastenkürzel `Ctrl + Shift + E` integriert.
- Deployment-QS um Import-Engine und Phase-42-Stylesheet erweitert.
- Zwei neue Testgruppen mit 119 Einzelprüfungen ergänzt; vollständige bestehende Testsuite erneut ausgeführt.
- App-Version auf 1.19.0 und Cachekennung auf 42.00 erhöht.
- Ventilatorauslegung und Hersteller-Bauteildatenbank bleiben weiterhin vollständig ausgeschlossen.

## Phase 41.00 – Hilfe-Center und geführte Erste Schritte

- Alte, auf Phase 21 basierende Bedienungsseite durch ein aktuelles, durchsuchbares Hilfe-Center ersetzt.
- Kontextbezogene Hilfe öffnet automatisch das passende Thema zur vorherigen Ansicht, etwa Teilstrecke, Formteil, Anlagenschema, Simulation oder Bericht.
- 13 kategorisierte Hilfethemen mit verständlichem Ablauf, Hinweisen und direkten Sprüngen in die jeweiligen Werkzeugbereiche ergänzt.
- Geführten Projektablauf mit zehn Schritten vom Projektstamm bis zur Übergabe ergänzt.
- Persönlicher Hilfe-Fortschritt wird lokal im Browser gespeichert und verändert keine Projektdaten.
- Vollständige Tastaturübersicht integriert; `F1` und `Ctrl + /` öffnen das Hilfe-Center aus jeder Ansicht.
- Rücksprung zur zuvor geöffneten Ansicht ergänzt.
- Responsive Oberfläche für Desktop, Tablet und Smartphone sowie Unterstützung für reduzierte Animationen ergänzt.
- Deployment-QS um Hilfe-Engine und Phase-41-Stylesheet erweitert.
- Zwei neue Testgruppen mit 61 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.18.0 und Cachekennung auf 41.00 erhöht.
- Ventilatorauslegung und Hersteller-Bauteildatenbank bleiben weiterhin vollständig ausgeschlossen.

## Phase 40.00 – Änderungsverlauf, Rückgängig und Wiederholen

- Neue `ProjectHistoryEngine` für einen sitzungsbezogenen Verlauf mit maximal 40 Projektständen ergänzt.
- Zusammengehörige Eingaben werden zeitlich gebündelt, damit das Tippen eines Werts nicht unnötig viele Einträge erzeugt.
- Flüchtige Berechnungsergebnisse werden aus den Snapshots entfernt; fachliche Projekt-, Anlagen-, Teilstrecken- und Bauteildaten bleiben enthalten.
- Rückgängig und Wiederholen im Ribbon mit vollständiger Beschriftung und zustandsabhängiger Deaktivierung ergänzt.
- Tastenkürzel `Ctrl + Z`, `Ctrl + Y`, `Ctrl + Shift + Z` und `Ctrl + Shift + H` ergänzt.
- Native Rückgängig-Funktion innerhalb von Eingabe-, Text- und Auswahlfeldern bleibt geschützt.
- Neue Ansicht **Projekt → Verlauf** mit Sitzungsjournal, Filtern, aktuellem Stand, Redo-Zweig und gezielter Wiederherstellung ergänzt.
- Manuell benennbare Wiederherstellungspunkte und CSV-Export des Verlaufs ergänzt.
- Beim Wiederherstellen werden aktive Anlage beziehungsweise Elementauswahl rekonstruiert und das Projekt neu berechnet.
- Verlauf in Sidebar, Statusleiste und Aufgaben-Schnellzugriffe integriert.
- Neue responsive Phase-40-Oberfläche ergänzt.
- Zwei neue Testgruppen mit 73 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.17.0 und Cachekennung auf 40.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 39.03 – Registerführung und Überlaufnavigation

- Einzeilige Registerleiste um sichtbare Links-/Rechts-Navigation ergänzt.
- Scrollpfeile erscheinen nur, wenn nicht alle vollständig beschrifteten Werkzeuge gleichzeitig sichtbar sind.
- Dezente Kantenverläufe zeigen weitere Werkzeuge ausserhalb des sichtbaren Bereichs an.
- Gruppenbezeichnungen Projekt, Einfügen, Berechnung, Ausgabe und Hilfe sind anklickbar und springen direkt zur jeweiligen Werkzeuggruppe.
- Aktive Ansicht markiert zusätzlich die zugehörige Werkzeuggruppe.
- Aktive Werkzeuge werden beim Ansichtswechsel automatisch in den sichtbaren Bereich geführt.
- Tastaturnavigation innerhalb der Werkzeugleiste mit Pfeiltasten sowie Pos1/Ende ergänzt.
- Mobile Werkzeugdarstellung bleibt unverändert als aufklappbares Menü erhalten.
- Berechnungs-, Speicher-, Lade- und Berichtlogik nicht verändert.

# Phase 39.02 – Werkzeugbeschriftungen vollständig sichtbar

- Funktionsbezeichnung unter jedem Symbol der Desktop-Registerleiste wieder eingeblendet.
- Auch sekundäre Werkzeuge wie Suche, Struktur, Anlagen, Cockpit, Workflow, Aufgaben, Sicherung, Projektcheck, Rechen-QS, Engineering-QS, Anlagenschema, Simulation, Abschluss, Übergabe, Demo, Hilfe und Info bleiben beschriftet.
- Einzeilige Registerleiste aus Phase 39.01 bleibt erhalten; bei geringerer Breite scrollt die Werkzeugzeile kontrolliert horizontal, statt Texte auszublenden oder Gruppen in eine zweite Reihe zu verschieben.
- Schmale Desktopbreiten verwenden kompaktere Schrift und Abstände, ohne die Funktionsnamen zu entfernen.
- Vorhandene Tooltips und Tastaturbeschriftungen bleiben zusätzlich erhalten.

# Phase 39.01 – Registerleiste einzeilig

- Logo und Werkzeuggruppen bilden jetzt eine gemeinsame, durchgehende Kopfzeile.
- Ausgabe- und Hilfegruppen können nicht mehr in eine zweite Zeile unterhalb des dunklen Ribbons ausbrechen.
- Sekundäre Werkzeugbeschriftungen werden auf normalen Desktopbreiten kompakt ausgeblendet; Symbole, Tooltips und Gruppenbezeichnungen bleiben erhalten.
- Wichtigste Aktionen wie Speichern, Berechnen und Bericht bleiben beschriftet.
- Horizontale Überbreite wird innerhalb der Registerleiste kontrolliert und ohne sichtbare Scrollleiste abgefangen.
- Mobile Werkzeugdarstellung bleibt unverändert als aufklappbares Menü erhalten.

# Änderungsverlauf

## Phase 39.00 – Strukturprüfung, Abhängigkeiten, Änderungsfolgen und Konfliktkontrolle

- Neuen Bereich **Projekt → Struktur** für projektweite Abhängigkeiten und Änderungsfolgen ergänzt.
- Projektgraph für Projekt, Anlagen, Teilstrecken, Formteile, Sonderbauteile, Aufgaben, Revisionen und Simulationsvarianten umgesetzt.
- Auswahl eines Projektelements mit Darstellung eingehender, ausgehender und erweiterter Beziehungen ergänzt.
- Neutrale Folgeanalyse für Berechnung, Engineering-QS, Anlagenschema, Live-Simulation, Bericht, Revisionen, Abschluss und Übergabe umgesetzt.
- Strukturprüfung auf fehlende und doppelte IDs, doppelte Teilstreckenbezeichnungen, nicht zugeordnete Bauteile, ungültige Teilstreckenbezüge sowie verwaiste Aufgaben-, Revisions- und Variantenreferenzen ergänzt.
- Struktur-Score mit kritischen Punkten, Warnungen, Hinweisen und filterbarer Konfliktliste eingeführt.
- Direkte Navigation aus Beziehungen und Konflikten zum betroffenen Projekt-, Anlagen-, Teilstrecken- oder Bauteilelement ergänzt.
- Struktur- und Konfliktanalyse als CSV-Export ergänzt.
- Professional Report um die Seite **Struktur- und Abhängigkeitsprüfung** erweitert.
- Gesamt-CSV um Struktur-Score, Element- und Verknüpfungsanzahl sowie Konfliktfeststellungen ergänzt.
- Ribbon, Sidebar, Statusleiste, Aufgaben-Schnellzugriffe und Tastenkürzel `Ctrl + Shift + D` erweitert.
- Responsive Phase-39-Oberfläche und Deployment-Diagnose ergänzt.
- Zwei neue Testgruppen mit insgesamt 96 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.16.0 und Cachekennung auf 39.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 38.00 – Globale Projektsuche, Projektindex und Querverweise

- Neuen Bereich **Projekt → Suche** für die projektweite Volltextsuche ergänzt.
- Projektindex für Projektangaben, Anlagen, Teilstrecken, Formteile, Sonderbauteile, Aufgaben, Revisionen und Simulationsvarianten umgesetzt.
- Gewichtete Trefferlogik mit exakten, beginnenden und enthaltenen Suchbegriffen ergänzt.
- Kategorie- und Anlagenfilter sowie vollständige Indexansicht ohne Suchbegriff umgesetzt.
- Querverweise von Projekt, Anlagen und Teilstrecken zu untergeordneten Bauteilen und Aufgaben ergänzt.
- Direkte Navigation aus Suchtreffern zu Projekt, Anlage, Teilstrecke, Formteil, Sonderbauteil, Aufgabenbereich, Revision und Simulation umgesetzt.
- Projektbezogene Sprungmarken mit maximal 24 Einträgen ergänzt.
- Projektbezogenen Suchverlauf mit maximal acht eindeutigen Suchbegriffen ergänzt.
- Vollständigen Projektindex als CSV-Export ergänzt.
- Projektsuche in Ribbon, Sidebar, Statusleiste, Aufgaben-Schnellzugriffe und Tastenkürzel `Ctrl + K` integriert.
- Responsive Suchoberfläche mit fixierter Suchleiste, Trefferkarten und mobilem Layout ergänzt.
- Deployment-Diagnose um Suchengine und Phase-38-Stylesheet erweitert.
- Zwei neue Testgruppen mit 70 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.15.0 und Cachekennung auf 38.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 37.00 – Projekt-Navigator, Aufgabenliste, Favoriten und Schnellzugriffe

- Neuen Bereich **Projekt → Aufgaben** als zentrale Arbeitsoberfläche für automatische QS-Punkte und manuelle Projektaufgaben ergänzt.
- Projektweite Feststellungen aus dem bestehenden Cockpit automatisch in priorisierte Aufgaben überführt.
- Aufgabenstatus **Offen**, **In Bearbeitung** und **Erledigt** mit dauerhaft gespeicherten Statusständen umgesetzt.
- Manuelle Aufgaben mit Priorität, Fälligkeit, Bearbeiter, Anlagen- und Teilstreckenbezug ergänzt.
- Filter für offene, kritische, überfällige, laufende, erledigte und alle Aufgaben sowie getrennte Quellenfilter ergänzt.
- Direkte Navigation aus Aufgaben zur betroffenen Anlage oder Teilstrecke umgesetzt.
- Schnellzugriffe zu Cockpit, Workflow, Engineering-QS, Anlagenschema, Simulation, Bericht, Abschluss und Sicherung ergänzt.
- Projektbezogene Favoriten für Ansichten, Anlagen und Teilstrecken mit maximal 16 Einträgen umgesetzt.
- Aufgaben- und Favoritenübersicht als CSV exportierbar gemacht.
- Professional Report bei offenen Aufgaben optional um eine eigene Seite **Projektaufgaben** erweitert.
- Aufgabenübersicht in Ribbon, Sidebar, Statusleiste und Tastenkürzel `Ctrl + Shift + T` integriert.
- Responsive Oberfläche für Desktop, Tablet und kleinere Bildschirme ergänzt.
- Deployment-Diagnose um Aufgabenengine und Phase-37-Stylesheet erweitert.
- Zwei neue Testgruppen mit insgesamt 77 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.14.0 und Cachekennung auf 37.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 36.00 – Projektworkflow, Prüfprofile und kontrollierte Massenbearbeitung

- Neuen Bereich **Projekt → Workflow** für Prüfprofile, Systemvorlagen, Massenbearbeitung und Änderungsprotokoll ergänzt.
- Vier herstellerneutrale Prüfprofile umgesetzt: allgemeine Planung, Komfort, Technikbereich und benutzerdefiniert.
- Engineering-QS auf das aktive Prüfprofil umgestellt; Geschwindigkeits-, Reibungs-, Verlustanteils- und Gesamtdruckverlustgrenzen werden projektbezogen ausgewertet.
- Plausibilitätsprüfung für frei definierte Prüfprofile ergänzt.
- Neutrale Systemvorlagen für Zu-/Abluft, vollständige Lüftungsanlage und Umluft ergänzt.
- Systemvorlagen ergänzen ausschliesslich fehlende Luftarten und überschreiben keine bestehenden Anlagen.
- Kontrollierte Massenbearbeitung für Luftmenge, Länge und Dimension mit Geltungsbereich, Rundung, optionaler Auswahl und Neunummerierung umgesetzt.
- Verbindliche Vorher-/Nachher-Vorschau sowie Fingerabdruckschutz gegen veraltete Massenänderungen ergänzt.
- Automatische lokale Sicherheitssicherung vor Vorlagen- und Massenänderungen integriert.
- Projektweites Änderungsprotokoll mit maximal 60 Einträgen, Bearbeiter, Zeitstempel und technischen Details ergänzt.
- Änderungsprotokoll als CSV exportierbar gemacht.
- Aktives Prüfprofil und Workflowdaten in Professional Report und Gesamt-CSV integriert.
- Ribbon, Sidebar, Tastenkürzel `Ctrl + Shift + W`, Statusleiste, Deployment-QS und responsive Oberfläche erweitert.
- Zwei neue Testgruppen mit insgesamt 96 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.13.0 und Cachekennung auf 36.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 35.00 – Projektcockpit und projektweite QS-Matrix

- Neuen Bereich **Projekt → Cockpit** für eine zentrale Projekt-, Risiko- und Dokumentationsübersicht ergänzt.
- Projekt-Score aus Engineering-Mittelwert, Dokumentationsvollständigkeit und priorisierten Feststellungen eingeführt.
- Projektweite Anlagenmatrix mit BKP, Luftart, Teilstrecken, Luftmenge, maximaler Geschwindigkeit, Gesamtdruckverlust und Engineering-Score umgesetzt.
- Engineering-Feststellungen aller Anlagen mit Anlagen- und Teilstreckenbezug zusammengeführt und nach Kritisch, Prüfen und Hinweis filterbar gemacht.
- Direkte Navigation aus der Risikomatrix zur betroffenen Anlage beziehungsweise Teilstrecke ergänzt.
- Prüfung auf doppelte Anlagenbezeichnungen, doppelte BKP-Nummern, leere Anlagen, fehlende BKP-Angaben und nicht klassifizierte Luftarten umgesetzt.
- Dokumentationsprüfung für Projektnummer, Projektname, Objekt, Bearbeiter, Firma, Berichtnummer und Revision ergänzt.
- Herstellerneutrale Luftartenübersicht mit informativen Summen ergänzt; keine automatische Luftbilanz und keine gemeinsame Druckverlustaddition.
- Projektcockpit als CSV-Export ergänzt.
- Professional Report bei Mehranlagen-Projekten um eine eigene Seite **Projektweite QS-Matrix** erweitert.
- Gesamt-CSV um Projekt-Score und projektweite Feststellungen erweitert.
- Zwei neue Testgruppen für Cockpit-Engine, UI, Bericht und CSV ergänzt.
- App-Version auf 1.12.0 und Cachekennung auf 35.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 34.00 – Anlagenmanager und projektweiter Anlagenvergleich

- Neuen Bereich **Projekt → Anlagen** für echte Mehranlagen-Projekte ergänzt.
- Anlagen können angelegt, vollständig dupliziert, geöffnet, umsortiert und – mit Schutz der letzten Anlage – gelöscht werden.
- Beim Duplizieren werden Teilstrecken-IDs neu erzeugt und alle Formteil- sowie Sonderbauteilzuordnungen sicher auf die neue Anlage umgebogen.
- Anlagenname, BKP-Nummer, Luftart und Beschreibung können zentral im Anlagenmanager gepflegt werden.
- Projektweite Kennwertübersicht mit Gesamtdruckverlust, Einlassluftmenge, maximaler Geschwindigkeit, Engineering-Score und Elementanzahlen je Anlage umgesetzt.
- Neutrale Sortierung nach Projektfolge, Bezeichnung, Druckverlust, Geschwindigkeit oder Engineering-Score ergänzt.
- Projektweiten Anlagenvergleich als CSV-Export ergänzt.
- Sidebar um eine eigene Anlagenliste erweitert; der Wechsel auf eine Anlage berechnet und zeigt jetzt zuverlässig genau den gewählten Anlagenstand.
- Automatische Neuberechnung im Arbeitsbereich auf die aktive Anlage umgestellt, damit Bearbeitungen in Mehranlagen-Projekten nicht versehentlich die erste Anlage berechnen.
- Professional Report um eine projektweite Anlagenübersicht ergänzt; bei Einanlagen-Projekten bleibt der bisherige Berichtsumfang unverändert.
- Deployment-Diagnose um Anlagenmanager-Engine und Phase-34-Stylesheet erweitert.
- Zwei neue Testgruppen mit 61 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.11.0 und Cachekennung auf 34.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 33.00 – Projektübergabe, Importkontrolle und Freigabepaket

- Neuen Bereich **Ausgabe → Übergabe** für kontrollierte Projektübernahme und dokumentierte Freigabe ergänzt.
- Nicht-destruktive Importvorschau für `.dvp`, `.dvpa`, `.dvph` und kompatible JSON-Dateien umgesetzt.
- Eingehende Dateien werden vor der Übernahme neu berechnet, diagnostiziert und mit Projektname, Revision, Schema, Version, Prüfsumme und Objektanzahlen dargestellt.
- Vergleich zum aktuell geöffneten Projekt mit Identitätsprüfung und Differenzen bei Teilstrecken, Formteilen und Sonderbauteilen ergänzt.
- Neuere Dateistände und automatische Normalisierungshinweise werden vor der Übernahme sichtbar ausgewiesen.
- Vor einer bestätigten Projektübernahme wird automatisch eine lokale Notfallsicherung des aktuellen Stands erstellt.
- Anlagenbezogenen Übergabestatus mit **Entwurf**, **Vorbereitet**, **Geprüft** und **Freigegeben** eingeführt.
- Vier-Augen-Dokumentation für vorbereitende, prüfende und freigebende Person sowie Übergabevermerk ergänzt.
- Freigabe an aktuellen Revisionsstand und vollständiges manuelles Prüfprotokoll gekoppelt.
- Neues integritätsgeschütztes `.dvph`-Freigabepaket mit eingebettetem `.dvpa`-Archiv, Projektdatei, Diagnose, Revisionen, Varianten und Freigabedaten eingeführt.
- Manipulierte oder beschädigte Übergabepakete werden über eine Paketprüfsumme abgewiesen.
- Separaten CSV-Export **Übergabeprotokoll** ergänzt.
- Übergabestatus und Freigabepersonen in Professional Report und Gesamt-CSV integriert.
- Deployment-QS um Übergabeengine und Phase-33-Stylesheet erweitert.
- Zwei neue Testgruppen mit 51 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.10.0 und Cachekennung auf 33.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 32.00 – Projektsicherheit, Archiv und Wiederherstellung

- Neuen Bereich **Projekt → Sicherung** für lokale Sicherungsstände, Wiederherstellung und gemeinsame Diagnose ergänzt.
- Datei-, Projekt- und Berechnungsdiagnose in einem neutralen Sicherheits-Score mit filterbaren Prüfpunkten zusammengeführt.
- Lokale Sicherungshistorie mit maximal acht vollständigen Projektständen und automatischer Vermeidung identischer Duplikate umgesetzt.
- Automatische Sicherheitssicherungen vor neuem Projekt, Demo-Projekt, Öffnen einer Datei und manuellem Projektdatei-Export ergänzt.
- Wiederherstellung lokaler Stände mit vorgeschalteter Notfallsicherung und anschliessender Kennzeichnung als ungespeicherter Projektstand umgesetzt.
- Portables `.dvpa`-Projektpaket mit eingebetteter `.dvp`-Nutzdatei, Diagnose, Abschlussdaten und stabiler Prüfsumme eingeführt.
- Manipulierte oder beschädigte Projektpakete werden vor der Wiederherstellung abgewiesen.
- Einzelne Sicherungsstände können wiederhergestellt, exportiert oder gelöscht werden; die gesamte Browserhistorie kann bewusst geleert werden.
- Vollständigen Diagnoseexport als CSV ergänzt.
- Deployment-QS um Sicherheitsengine, Stylesheet und Ribbon-Aktion erweitert.
- Zwei neue Testgruppen mit insgesamt 46 Einzelprüfungen ergänzt; vollständige bestehende Testsuite weiterhin bestanden.
- App-Version auf 1.9.0 und Cachekennung auf 32.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 31.00 – Technischer Revisionsvergleich und internes Prüfprotokoll

- Revisionssnapshots um technische Detaildaten für Teilstrecken, Formteile und Sonderbauteile erweitert.
- Frei wählbare Basisrevision je Anlage für den Vergleich mit dem aktuellen Projektstand ergänzt.
- Hinzugefügte, entfernte und geänderte Elemente werden einzeln erkannt und nach Kategorie dokumentiert.
- Änderungen an Luftmenge, Dimension, Länge, Geschwindigkeit, Reibung und Druckverlust werden mit Vorher-/Nachher-Wert und Differenz ausgewiesen.
- Revisionsvergleich im Abschlussbereich um Zusammenfassung, Filter, direkte Elementnavigation und eigenen CSV-Export ergänzt.
- Professional Report um eine optionale, automatisch eingeplante Seite **Revisionsvergleich** erweitert.
- Gesamt-CSV um technische Revisionsänderungen ergänzt.
- Internes Prüfprotokoll mit sechs manuellen Fachkontrollen, Prüfperson, Datum und Vermerk umgesetzt.
- Manuelles Prüfprotokoll in Abschluss-Score, Freigabeseite des Berichts und Gesamt-CSV integriert.
- `.dvp`-Roundtrip für technische Snapshots, Vergleichsbasis und Prüfprotokoll abgesichert.
- Ältere Phase-30-Snapshots bleiben kompatibel und werden transparent als Detaildaten nicht verfügbar gekennzeichnet.
- Zwei neue Testgruppen mit insgesamt 48 Einzelprüfungen ergänzt.
- App-Version auf 1.8.0 und Cachekennung auf 31.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 30.00 – Projektabschluss, Variantenarchiv und Revisionsstand

- Neuen Arbeitsbereich **Abschluss** mit neutralem Projektstatus, Score und sieben Bereitschaftsprüfungen ergänzt.
- Live-Simulation um ein lokales Variantenarchiv mit Name, Bemerkung, Bearbeiter und maximal zwölf gespeicherten Varianten erweitert.
- Varianten können wieder in die Simulation geladen, für den Bericht ausgewählt oder entfernt werden.
- Berechnungs-Fingerprints erkennen, ob eine Berichtsvariante noch zum aktuellen Teilstreckenstand passt.
- Automatische Revisionssnapshots mit Gesamtdruckverlust, Verlustanteilen, kritischer Teilstrecke, Engineering-Score und Objektanzahlen ergänzt.
- Revisionshistorie wird im Projekt gespeichert und in den Professional Report übernommen.
- Professional Report um eine optionale Seite **Variantenvergleich** mit Bestand, Szenario, Differenzen, Parametern und den zehn grössten Teilstreckenänderungen erweitert.
- CSV-Export um Revisionsverlauf und Variantenvergleich ergänzt.
- Export-Checkliste warnt nur bei tatsächlich vorhandenen, aber nicht ausgewählten oder veralteten Varianten; Projekte ohne Varianten bleiben ohne unnötige Warnung.
- `.dvp`-Roundtrip für Varianten, ausgewählte Berichtsvariante und Revisionssnapshots abgesichert.
- Ribbon-Aktion **Ausgabe → Abschluss**, responsive Abschlusskarten und Archivdarstellung ergänzt.
- Neue automatisierte Testgruppen für Abschluss-Engine, UI und Bericht mit insgesamt 57 Einzelprüfungen ergänzt.
- App-Version auf 1.7.0 und Cachekennung auf 30.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 29.00 – Anlagenanalyse und PDF-Schema Pro

- Technische Anlagenansicht um drei neutrale Darstellungsmodi erweitert: Standard, Geschwindigkeit und Druckverlust.
- Teilstrecken und Kanalzüge werden im Analysemodus abgestuft hervorgehoben, ohne Hersteller- oder Produktbezug.
- PDF-Anlagenschema vollständig neu aufgebaut: maximal fünf Teilstrecken je Seite, getrennte Einlass-/Endbereiche und klarere Kartenanordnung.
- Kanalhöhen und Dimensionswechsel werden im Bericht als durchgehender schematischer Kanalzug mit Übergängen dargestellt.
- Lange Anlagen erhalten automatisch Fortsetzungsseiten mit eindeutigem Teilstreckenbereich und Fortsetzungsangaben.
- Formteile und Sonderbauteile werden im Schema mit getrennten Zählern ober- und unterhalb der zugeordneten Teilstrecke dargestellt.
- Kennwertleiste des PDF-Schemas um Einlassluftmenge und maximale Geschwindigkeit erweitert.
- SVG-Ausgabe mit expliziten Füll-, Linien- und Textattributen für stabilere Darstellung in unterschiedlichen PDF-Renderern abgesichert.
- Neue automatisierte Prüfungen für Seitenaufteilung, Überlagerungsfreiheit, Fortsetzungen und Analysemodi ergänzt.
- App-Version auf 1.6.0 und Cachekennung auf 29.00 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen.

## Phase 26–28 – Professional Report und Live-Simulation

- Professional Report um eine Management-Zusammenfassung mit zentralen Projekt-, Anlagen- und QS-Kennwerten erweitert.
- Interaktive Anlagenzeichnung als eigener Berichtsteil mit automatischem Seitenumbruch für lange Anlagen integriert.
- Druckverlustanalyse mit Verlustanteilen, kritischer Teilstrecke und neutraler Ergebnisbewertung ergänzt.
- Engineering-QS samt Score, Status, priorisierten Feststellungen und Empfehlungen in Bericht und CSV-Ausgabe aufgenommen.
- Berichtsumfang und drei Berichtsvorlagen um die neuen Kapitel erweitert; Seitennummerierung und Seitenplan bleiben automatisch konsistent.
- Nicht-destruktive Live-Simulation für Luftmengen von 50 bis 150 Prozent und Abmessungen von 75 bis 160 Prozent ergänzt.
- Varianten können für die gesamte Anlage oder eine einzelne Teilstrecke berechnet werden, ohne das Projekt zunächst zu verändern.
- Bestand und Variante werden live über Kennzahlen, Vergleichsbalken und eine nach Druckverluständerung sortierte Teilstreckentabelle gegenübergestellt.
- Explizite Übernahmefunktion mit Sicherheitsabfrage ergänzt; erst danach werden Projektwerte geändert und vollständig neu berechnet.
- Simulationslogik, Oberfläche und Professional Report durch neue automatisierte Engine-, UI- und Berichtstests abgesichert.
- App-Version auf 1.5.0 und Cachekennung auf 26.28 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben vollständig ausgeschlossen; alle Funktionen bleiben herstellerneutral.

## Phase 24.10 – Anlagenzeichnung Pro

- Bisherige lineare Punkt-/Kartenansicht durch einen neuen SVG-Zeichenkern ersetzt.
- Rechteckkanäle und Rundrohre als zusammenhängende Kanalzüge mit dimensionsabhängiger Darstellung umgesetzt.
- Übergänge zwischen unterschiedlichen Bauformen und Dimensionen automatisch sichtbar gemacht.
- Einlass, Anlagenende und feste Strömungspfeile ergänzt; Überlagerungen am Beginn und Ende beseitigt.
- Teilstreckenkarten mit korrekt in Millimeter umgerechneten Dimensionen, Luftmenge, Geschwindigkeit und Druckverlust neu aufgebaut.
- Herstellerneutrale Vektorsymbole für Bögen, Übergänge, Abzweige, Filter, Schalldämpfer, Klappen, Register und Luftdurchlässe ergänzt.
- Bauteile per Maus und Tastatur anwählbar gemacht; Detaildialoge zeigen verfügbare ζ- und Druckverlustwerte.
- Zoom, Zurücksetzen, Zentrieren, Alles-anzeigen, Strg/Mausrad und Verschieben mit gedrückter Maustaste ergänzt.
- Untere Kennwertleiste für Gesamtdruckverlust, Einlassluftmenge und maximale Geschwindigkeit ergänzt.
- Responsive Tablet-/Mobilansicht sowie Druckdarstellung ergänzt.
- Automatische Anfangsanpassung sorgt dafür, dass auch breite Anlagen vollständig sichtbar starten.
- Engine- und UI-Testreihen auf 58 Einzelprüfungen für die Anlagenzeichnung erweitert.
- App-Version auf 1.4.1 und Cachekennung auf 24.10 erhöht.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben weiterhin vollständig ausgeschlossen.

## Phase 23–24 – Engineering-QS und Anlagenschema

- Herstellerneutrale Engineering-Qualitätskontrolle mit priorisierten Hinweisen eingeführt.
- Prüfungen für Geschwindigkeit, Reibungsgradient, Verlustkonzentration, negative Verluste und Datenqualität ergänzt.
- Engineering-Score von 0 bis 100 mit Kritisch-/Warn-/Hinweis-Zusammenfassung ergänzt.
- Direkte Navigation von einem QS-Hinweis zur betroffenen Teilstrecke umgesetzt.
- Interaktive schematische Anlagenansicht aus der Teilstreckenreihenfolge ergänzt.
- Teilstrecken zeigen Dimension, Luftmenge, Geschwindigkeit und Druckverlust.
- Formteile und Sonderbauteile werden neutral als Zuordnungspunkte dargestellt.
- Neue Ribbon-Aktionen „Engineering-QS“ und „Anlagenschema“ ergänzt.
- Zwei neue Engine-Testreihen mit 17 Einzelprüfungen ergänzt.
- Phase 25 Ventilatorauslegung und Phase 27 Hersteller-Bauteildatenbank bleiben bewusst ausgeschlossen.

# Phase 22.04 – Responsive Darstellung und Design-Feinschliff

- Mobile Projektstruktur als seitlich einblendbares Panel mit Hintergrundabdunklung umgesetzt.
- Sidebar auf kleinen Bildschirmen standardmässig geschlossen; Öffnen, Schliessen per Hintergrund und Escape ergänzt.
- Desktop-Einstellung der Sidebar bleibt unabhängig vom mobilen Zustand gespeichert.
- Arbeitsbereich, Statusleiste und Dialoge auf dynamische Viewport-Höhen und Gerätesicherheitsränder abgestimmt.
- Dialoge auf Mobilgeräten als gut bedienbare Bottom-Sheets mit fest erreichbaren Aktionen gestaltet.
- Touch-Ziele, Fokusmarkierungen, horizontale Tabellen, Filterchips und kleine Bildschirmbreiten verbessert.
- Sprunglink zum Arbeitsbereich und klarere Tastaturbedienung ergänzt.
- UI-Cachekennung 22.04 eingeführt; Rechen-, Speicher- und Berichtlogik unverändert.

# Phase 22.03 – Bibliotheken und Dialogfenster

- Formteilbibliothek mit klarerem Seitenkopf, aktiver Teilstrecken-Zusammenfassung und kompakter Bibliotheksnavigation überarbeitet.
- Suche so stabilisiert, dass Fokus, Cursorposition und Scrollstand beim Filtern erhalten bleiben.
- Kategorie-Filter um Trefferzahlen, Suchfeld um Löschfunktion und Bibliotheksstatus ergänzt.
- Formteilkarten mit technischer Skizzenfläche, Bauform-Hinweis, Funktionsmerkmalen und klarer Auswahlaktion neu gestaltet.
- Favoriten und zuletzt verwendete Formteile auf die aktive Teilstrecke bezogen dargestellt.
- Sonderbauteilbibliothek mit Vorlagen-/Projektzähler, Herstellerhinweisen, Druckverlustansatz und eindeutiger Einfügeaktion verbessert.
- Bibliotheksgruppen, Favoriten, zuletzt verwendete Einträge sowie Verwaltungszeilen visuell vereinheitlicht.
- Einheitlichen, barrierearmen Dialogdienst für Hinweise, Fehler, Löschabfragen, Neunummerierung, ungespeicherte Änderungen und Exportwarnungen ergänzt.
- Dialoge unterstützen Tastaturfokus, Escape, Fokusbegrenzung, mobile Darstellung und reduzierte Animationen.
- UI-Cachekennung 22.03 eingeführt, ohne Rechen-, Speicher- oder Berichtlogik zu verändern.

# Phase 22.02 – Arbeitsbereich, Eingaben und Ergebnisse

- Seitenköpfe für Projekt, Anlage, Teilstrecke, Formteil und Sonderbauteil mit klarer Kontext- und Ergebniszusammenfassung überarbeitet.
- Eingabebereiche als ruhige, technische Feldgruppen mit besserer Beschriftung und Hilfetexten gestaltet.
- Einheiten direkt an Zahlenfeldern geführt, unter anderem für m³/h, m, mm, m/s, Pa und Winkel.
- Dynamische Formteilparameter automatisch mit passenden Einheitselementen ausgestattet; berechnete Felder klar gekennzeichnet.
- Ergebnisbereiche mit stärkerer Kennzahlenhierarchie, hervorgehobenen Totalkarten und Systemanteilen überarbeitet.
- Druckverlustaufteilung um proportionale Balkendarstellung für Reibung, ζ-Verluste, Direktverluste und Sonderbauteile ergänzt.
- Tabellen mit scrollbaren Containern, fixierten Kopfzeilen, besserer Zahlenführung und hervorgehobenen Summenzeilen verbessert.
- Darstellung für Tablet und Mobilgeräte angepasst, ohne Rechen-, Speicher- oder Berichtlogik zu verändern.
- UI-Cachekennung 22.02 eingeführt.

# Phase 22.01 – Ribbon und Projektstruktur

- Oberes Ribbon in die Bereiche Projekt, Einfügen, Berechnung, Ausgabe und Hilfe gegliedert.
- Einheitliche Vektorsymbole, klar erkennbare Hauptaktionen und aktive Ansichten ergänzt.
- Speicher- und Berechnungsstatus direkt im Ribbon sichtbar gemacht.
- Kompaktes Werkzeugmenü für kleinere Fenster und mobile Ansichten ergänzt.
- Sidebar um Projektsuche, Trefferanzeige sowie Alle-öffnen-/Alle-schliessen-Funktionen erweitert.
- Teilstrecken, Formteile, Sonderbauteile und Auswertung dauerhaft ein- und ausklappbar gemacht.
- Projektbaum mit einheitlichen Symbolen, Zusatzinformationen und klarerer Auswahlmarkierung neu aufgebaut.
- Sidebar vollständig einklappbar und zwischen 238 und 440 Pixel Breite verstellbar gemacht; Einstellung wird lokal gespeichert.
- Tastenkürzel `/` zum Fokussieren der Projektsuche und `Esc` zum Leeren ergänzt.
- UI-Cachekennung 22.01 eingeführt, ohne Rechen-, Speicher- oder Berichtlogik zu verändern.

# Phase 22.00 – Designsystem und visuelle Grundbereinigung

- Einheitliche Marken-, Neutral- und Statusfarben als zentrale CSS-Variablen eingeführt.
- Abstände, Rundungen, Schatten, Fokusdarstellung und Typografie vereinheitlicht.
- Ribbon, Sidebar, Arbeitsbereich, Karten, Formulare, Tabellen und Statusleiste visuell beruhigt.
- Bestehende Rechen-, Speicher-, Berichts- und Bedienlogik unverändert gelassen.
- Responsive Grunddarstellung und reduzierte Animationen verbessert.

# CHANGELOG

## Phase 21.12 – Projektbereinigung und konsolidierter Gesamtstand

- Git-Verlaufsdaten und lokale Repository-Metadaten aus der auslieferbaren Projekt-ZIP entfernt.
- Alte Änderungslisten, historische Sprint-Einzeldokumente und das frühere Cleanup-Skript entfernt.
- Nicht mehr importierte Komponenten, frühere Kompatibilitäts-Rechen-/Berichtsmodule und ungenutztes CSS entfernt.
- Doppelte Formteilbilder und Excel-Dateien auf eine kanonische flache Ablage unter `assets/formteile/` reduziert.
- Nicht mehr verwendete Alias-Bilder und die doppelte Logo-Datei entfernt.
- Historische und unreferenzierte Tests entfernt; aktive Browser- und Node-Testreihen vollständig beibehalten.
- Deployment-Diagnose auf den aktiven Rechenkern `src/core/CalculationEngine.js` und die aktuelle Bericht-Engine ausgerichtet.
- Bildpfade in Registry, Arbeitsbereich und Bericht auf die kanonische Asset-Struktur konsolidiert.
- README und Architekturdokumentation auf den tatsächlichen Projektstand neu aufgebaut.
- Cache-Version auf 21.12 und App-Version auf 1.3.12 erhöht.

## Phase 21.11 – Beta-Feedback-Auswertung und Fehlerliste

- Mehrere JSON-Rückmeldungen aus dem Beta-Feedback können gemeinsam importiert werden.
- Rückmeldungen werden nach Priorität sortiert und als offene, bearbeitbare Fehlerliste dargestellt.
- Status, Prioritätskorrektur, Verantwortliche, Zielversion und interne Notiz je Rückmeldung ergänzt.
- Duplikat-Kandidaten werden über Kategorie, Titel und Fehlerbild automatisch erkannt.
- Filter für Suche, Kategorie, Priorität und Bearbeitungsstatus ergänzt.
- Auswertung lokal im Browser gespeichert; Einzelmeldungen können entfernt oder die Liste komplett geleert werden.
- Export als JSON und CSV sowie kopierbare Gesamt- und Issue-Texte ergänzt.
- Direkter Aufruf über `app.html?feedback-auswertung=1` und Rechen-QS ergänzt.
- Deployment-QS um Feedback-Auswertungsmodell, Oberfläche und Browsertest erweitert.
- Eigenen Browser-/Node-Test mit 29 Einzelprüfungen ergänzt und `npm test` erweitert.
- Automatischer Beta-Teststand auf 11 Prüfserien und 443 dokumentierte Einzelprüfungen aktualisiert.
- Cache-Version auf 21.11 und App-Version auf 1.3.11 erhöht.

## Phase 21.10 – Beta-Feedback und Fehlererfassung

- Einzelne Beta-Rückmeldungen im Tool und auf `feedback.html` strukturiert erfassbar gemacht.
- Kategorie, Priorität, Fehlerbeschreibung, Nachstellschritte, Ist-/Soll-Ergebnis und Projektkontext ergänzt.
- Lokale Zwischenspeicherung sowie JSON-, TXT- und CSV-Export ergänzt.
- Direkten Aufruf über `app.html?feedback=1` ergänzt.
- Eigenen Test mit 18 Einzelprüfungen ergänzt.
- Cache-Version auf 21.10 und App-Version auf 1.3.10 erhöht.

## Phase 21.09 – Öffentliche Beta konsolidiert

- Eigene öffentliche Beta-Testseite `beta.html` mit Testablauf, bekannten Grenzen und direkten Einstiegen ergänzt.
- Konsolidierten Beta-Freigabestand im Tool unter **Rechen-QS → Beta-Freigabestand** ergänzt.
- Automatischen Teststand, reale Fachtest-Rückmeldungen, Freigabeentscheidung, offene Massnahmen und Deployment-Checkliste zusammengeführt.
- Beta-Verantwortung, Datum, Zielversion, öffentliche URL, Freigabehinweis und bekannte Grenzen dokumentierbar gemacht.
- Lokale Speicherung sowie Text-, JSON- und CSV-Export des Beta-Protokolls ergänzt.
- Direkten Start über `app.html?beta=1` ergänzt.
- Hauptseite und Footer dezent mit der öffentlichen Beta verknüpft.
- Sitemap und Web-App-Manifest um die Beta-Seite erweitert.
- Eigenen Browser-/Node-Test mit 27 Einzelprüfungen ergänzt und `npm test` erweitert.
- Cache-Version auf 21.09 und App-Version auf 1.3.9 erhöht.

## Phase 21.08 – Fachliche Freigabeentscheidung und Korrekturplan

- Formelles Freigabeprotokoll auf Basis der gebündelten Fachtest-Runde ergänzt.
- Entscheidung, freigebende Person, Datum, Zielversion und Freigabevermerk dokumentierbar gemacht.
- Automatischen Entscheidungsvorschlag aus Fehlern, Hinweisen und offenen Prüfpunkten ergänzt.
- Korrektur- und Nachtestplan mit Priorität, Status, Verantwortlichen, Termin, Massnahme und Nachtestergebnis ergänzt.
- Lokale Speicherung der Freigabeentscheidung im Browser integriert.
- Text-, JSON- und CSV-Export des Freigabeprotokolls ergänzt.
- Direkten Zugang über Rechen-QS, Fachtest-Auswertung, Hilfe und `app.html?freigabe=1` ergänzt.
- Deployment-QS um Freigabemodul, Oberfläche und Browsertest erweitert.
- Eigenen Browser-/Node-Test mit 24 Einzelprüfungen ergänzt und `npm test` erweitert.
- Cache-Version auf 21.08 und App-Version auf 1.3.8 erhöht.

## Phase 21.07 – Fachtest-Runde und Freigabeauswertung

- Maschinenlesbaren JSON-Export für einzelne Fachtester-Protokolle ergänzt.
- Neue Fachtest-Auswertung zum Import mehrerer JSON-Rückmeldungen integriert.
- Prüfpunkte, Status, Bemerkungen und Freigabeempfehlungen aller Tester zusammengeführt.
- Automatische Priorisierung für Fehler, Auffälligkeiten und noch nicht geprüfte Punkte ergänzt.
- Abgeleiteten Entscheidungsstatus ergänzt: Freigabe vorbereitet, Freigabe mit Hinweisen, Nachtest erforderlich oder blockiert.
- Auswertung lokal im Browser gespeichert; einzelne Rückmeldungen können entfernt oder die Runde komplett geleert werden.
- Text- und CSV-Ausgabe der gebündelten Auswertung ergänzt.
- Direkter Zugang über Rechen-QS, Fachtester-Protokoll und Hilfe ergänzt.
- Eigenen Browser-/Node-Test mit 16 Einzelprüfungen ergänzt und `npm test` erweitert.
- Cache-Version auf 21.07 und App-Version auf 1.3.7 erhöht.

## Phase 21.06a – Farbwelt der Hauptseite

- Berechnungstool farblich exakt an die bereitgestellte Hauptseite angepasst.
- Kopfbereich wieder dunkelblau mit dem Hero-Verlauf der Hauptseite gestaltet.
- Blau-/Violett-Verlauf für Hauptaktionen und Cyan-Akzente für Prüfaktionen übernommen.
- Markenblock mit EO-Logo, „Druckverlust Pro“ und „Professional“ vollständig erhalten.
- Helle Arbeitskarten, Eingabefelder und Tabellen mit der Hauptseiten-Palette vereinheitlicht.
- Statusleiste als dunklen Signalstreifen gestaltet.
- Theme-Color und Web-App-Metadaten auf die neue Farbwelt nachgezogen.
- Rechen-, Projekt- und Berichtsfunktionen unverändert gelassen.
- Cache-Version auf 21.06a und App-Version auf 1.3.6a erhöht.

## Phase 21.06 – Einheitliches Oberflächendesign

- Berechnungstool optisch an die Produkt-/Hauptseite angeglichen.
- Hellen, leicht transparenten Kopfbereich mit konsistenten Pillen-Schaltflächen ergänzt.
- Den bestehenden Markenblock mit EO-Logo, „Druckverlust Pro“ und „Professional“ vollständig beibehalten.
- Sidebar und Arbeitsbereich als schwebende, abgerundete Karten mit ruhigerem Schatten und mehr Abstand gestaltet.
- Formulare, Tabellen, Statusleiste, Hinweise und Aktionsschaltflächen auf dieselbe Farb- und Formensprache vereinheitlicht.
- Hauptaktionen im Ribbon klar hervorgehoben; Prüfaktionen bleiben dezent erkennbar.
- Responsive Darstellung für kleinere Fenster verbessert.
- Neue Styles bewusst als separates Override `src/ui/phase21_06.css` ergänzt, ohne Rechen- oder Projektlogik zu verändern.
- Cache-Version auf 21.06 und App-Version auf 1.3.6 erhöht.

## Phase 21.05 – Öffentliche Fachtest-Version und strukturiertes Prüfprotokoll

- Fachtester-Protokoll mit 10 manuellen Prüfschritten für Projekt, Teilstrecken, Formteile, Sonderbauteile, `.dvp`, Bericht/PDF, Plausibilität und Bedienung ergänzt.
- Automatischen Vorabcheck aus Referenztests, Formteil-QS, Formteil-Sync-QS, Vergleichsmatrix und Praxisprojekt-QS zusammengeführt.
- Aktueller Vorabcheck umfasst 5/5 bestandene Prüfserien und 329/329 Einzelprüfungen.
- Testerangaben, Umgebung, Status, Bemerkungen, Gesamtbewertung und Freigabeempfehlung lokal speicherbar gemacht.
- TXT-, CSV- und Zwischenablage-Export für das Fachtester-Protokoll ergänzt.
- Direkte Startadresse `app.html?fachtest=1` sowie Fachtest-Link auf der Produktseite ergänzt.
- Eigenen Browser- und Node-Test für Protokollmodell, Fortschritt, Validierung und Export ergänzt.
- `npm test` und Deployment-QS um die Fachtest-Dateien erweitert.
- Cache-Version auf 21.05 und App-Version auf 1.3.5 erhöht.


## Phase 21.04 – Fachliche Vergleichsmatrix und Handrechnungen

- Zehn feste Handrechnungen für drei Rechteckkanäle, drei Rundrohre, Luftdichte-, Reibungszahl- und Summenfälle ergänzt.
- 92 Einzelprüfungen für Fläche, hydraulischen Durchmesser, Geschwindigkeit, dynamischen Druck, Reibungsgefälle, Reibungsverlust, ζ-Verlust, Summenbildung und 0,5-Pa-Rundung ergänzt.
- Sollwerte unabhängig vom Rechenkern fest hinterlegt; keine Laufzeit-Ableitung aus Ist-Ergebnissen.
- Vergleichsmatrix direkt unter **Rechen-QS → Vergleichsmatrix** integriert.
- Textprotokoll und semikolongetrennte CSV-Matrix können kopiert werden.
- Separate Browser-Testseite und Node-Testlauf `npm run test:comparison` ergänzt.
- `npm test` um die Vergleichsmatrix erweitert.
- Deployment-QS um Diagnose, Runner, Fälle und Browser-Testseite erweitert.
- Cache-Version auf 21.04 und App-Version auf 1.3.4 erhöht.


## Phase 21.03 – Formteil-Grössen- und Anschluss-Synchronisation

- Automatische Grössenübernahme aller 14 registrierten Formteile mit 15 Testfällen und 113 Einzelprüfungen abgesichert.
- Anschlussdefinitionen werden jetzt aus den tatsächlich vorhandenen `AD/WD`- und `AA/WA`-Parametern abgeleitet.
- T-Abzweig rund 1/2 um automatische Durchgangszuordnung `AD/WD` ergänzt.
- Wirkungslosen Abzweig-Selector beim T-Abzweig Durchgang rund 1 entfernt.
- Änderungen an Anschluss-Teilstrecken führen zugehörige Formteilgrössen und Luftmengen automatisch nach.
- Haupt-Synchronisation erhält separat gewählte Durchgangs- und Abzweigwerte.
- Manuelle Overrides und bewusst erzwungene Synchronisation automatisiert geprüft.
- Neues Formteil-Sync-QS im Tool, als Browsertest und über `npm run test:sync` ergänzt.
- Deployment-QS um Sync-Diagnose, Runner und Browsertest erweitert.
- Cache-Version auf 21.03 und App-Version auf 1.3.3 erhöht.

## Phase 21.02 – Praxisprojekt, Speicher-Roundtrip und Berichtstest

- Deterministisches Grossprojekt mit 48 Teilstrecken, 36 Formteilen und 26 Sonderbauteilen ergänzt.
- Automatischen Praxisprojekt-Runner mit 29 Einzelprüfungen ergänzt.
- Früher kritischen Berichtsumfang mit mehr als 42 Teilstrecken abgesichert.
- Mehrseitige Berichte geprüft: 2 Hauptnetzseiten, 9 Formteilseiten, 2 Sonderbauteilseiten und insgesamt 20 Seiten.
- `.dvp`-Speicher-/Lese-Roundtrip auf vollständige Einträge und IDs geprüft.
- Neues Praxisprojekt-QS direkt unter **Rechen-QS → Praxisprojekt-QS** ergänzt.
- Browser-Testseite und Node-Testlauf `npm run test:practice` ergänzt.
- `npm test` führt jetzt Kern-, Formteil- und Praxisprojekt-Tests gemeinsam aus.
- Deployment-QS um Praxisprojekt-, Diagnose- und Testdateien erweitert.
- Cache-Version auf 21.02 und App-Version auf 1.3.2 erhöht.

## Phase 21.01 – Formteilbibliothek und Excel-Referenzprüfung

- Alle 14 registrierten Formteile strukturell geprüft: IDs, Kategorien, Berechnungsfunktionen, Parameter, Bilder und Excel-Referenzdateien.
- 18 feste Excel-Referenzfälle mit 56 Einzelprüfungen ergänzt.
- Bild- und Excel-Pfade der Registry auf die tatsächlich verwendete Root-Struktur `assets/formteile/` korrigiert.
- Excel-Suchlogik beim Hosenstück, T-Abzweig rund 2 und 90° T-Stück Variante 2 an die hinterlegten Vorlagen angepasst.
- Neues Formteil-QS direkt unter **Rechen-QS → Formteil-QS** ergänzt.
- Browser-Testseite und Node-Testlauf `npm run test:formparts` ergänzt.
- Manifest auf alle 14 Formteile erweitert und mit Validierungsstatus versehen.
- Cache-Version auf 21.01 und App-Version auf 1.3.1 erhöht.

## Phase 21.00 – Fachliche Referenztests

- Feste Referenzfälle für Rechteckkanal, Rundrohr, Summenbildung, Rundung und Eingaben ergänzt.
- Bestehenden Excel-Vergleich `TEST-001` in denselben automatischen Testlauf integriert.
- DOM-unabhängigen Test-Runner unter `src/testing/ReferenceTestRunner.js` ergänzt.
- Ausführung über `npm test`, Browser-Testseite und direkt im Tool unter **Rechen-QS → Referenztests** ermöglicht.
- Referenzarten transparent getrennt: mathematische Formelreferenzen und externer Excel-Vergleich.
- Deployment-QS um die neuen Referenztest-Module erweitert.
- Cache-Version auf 21.00 und App-Version auf 1.3 erhöht.

## Phase 20.04 – Roadmap, Feedback und Changelog

- Produktseite um kompakten Bereich „Ständige Weiterentwicklung“ ergänzt.
- Roadmap für fachlichen Ausbau, weitere Gebäudetechnik-Module und spätere Plattformfunktionen sichtbar gemacht.
- Hilfeseite im Tool um Roadmap, Feedback-Vorlage und Versionshistorie erweitert.
- Direkte Links von der Produktseite zu Roadmap und Feedback im Tool ergänzt.
- Cache-Version auf 20.04 erhöht.


## Phase 20.03 – Lizenz-Gate und Exportstatus

- Syntax/Formatierung der Lizenz-Textausgabe bereinigt.
- Neues zentrales Modul `src/licensing/LicenseGate.js` ergänzt.
- Exportstatus für PDF-/HTML-Berichte vorbereitet und im Berichtmodell mitgeführt.
- Export-QS und Anlageninformationen zeigen den Lizenz-/Exportstatus.
- Produktseite und Lizenzseite um Exportstatus-Hinweis erweitert.
- Deployment-QS prüft jetzt auch Lizenz-Konfiguration und License-Gate.
- Cache-Version auf 20.03 erhöht.

## Phase 20.02 – Lizenzmatrix und Feature-Flags

- Lizenzmatrix für Test, Professional und spätere Lizenz-/Abo-Stufe ergänzt.
- Feature-Flags in `src/licensing/licenseConfig.js` vorbereitet.
- Produktseite und Lizenzseite zeigen die vorbereitete Funktionsmatrix.
- Tool-Hilfe zeigt den Lizenzstatus mit kompakten Feature-Hinweisen.
- Cache-Version auf 20.02 erhöht.


## Phase 20.01 – Lizenzstatus im Tool vorbereitet

- Lizenzstatus **Professional Preview** sichtbar vorbereitet.
- Produktseite und `lizenz.html` zeigen jetzt Statuskarten zu Modus, Login, Zahlung und technischer Sperre.
- `src/licensing/licenseConfig.js` um aktiven Plan, Fähigkeiten, offene Punkte und Textausgabe erweitert.
- Info-Dialog im Tool zeigt den aktuellen Lizenzstatus und die Lizenzhinweise.
- Hilfeseite im Tool enthält neu einen kompakten Lizenzstatus-Block.
- `window.DruckverlustPro.license` für spätere Diagnose/Weiterentwicklung ergänzt.
- Weiterhin keine Zahlung, kein Login und keine Zugriffssperre aktiv.
- Cache-Busting auf `20.01` erhöht.


## Phase 20.00 – Lizenz-/Abo-Vorbereitung

- Produktseite um kompakten Bereich **Lizenz / Ausblick** ergänzt.
- Neue Seite `lizenz.html` mit vorbereiteten Nutzungsstufen erstellt.
- Navigation, Footer, Sitemap und Web-App-Manifest um Lizenzübersicht ergänzt.
- Neue technische Lizenz-Konfigurationsdatei `src/licensing/licenseConfig.js` vorbereitet.
- Noch keine Zahlung, kein Login und keine Zugriffssperre aktiviert.
- Cache-Busting auf `20.00` erhöht.

## Phase 20.00 – Deployment-Feinschliff, Sitemap und App-Metadaten

- `site.webmanifest` ergänzt, damit Druckverlust Pro als Web-App sauber erkannt wird.
- `robots.txt` und `sitemap.xml` für GitHub-Pages-Indexierung ergänzt.
- `404.html` als eigene Fehlerseite mit Rücksprung zur Produktseite und zum Tool ergänzt.
- Manifest-Link und mobile Web-App-Metadaten auf Produkt-, Tool- und Rechtseiten ergänzt.
- Cache-Busting auf `20.00` erhöht.

## Phase 19.09 – Kontakt und Rechtliches vorbereitet

- Produktseite um kompakten Bereich **Kontakt / Feedback** erweitert.
- Footer um Links zu **Impressum** und **Datenschutz** ergänzt.
- Neue Platzhalterseiten `impressum.html` und `datenschutz.html` erstellt.
- Rechtliche Seiten klar als vorbereitete Platzhalter markiert, damit vor Veröffentlichung die Pflichtangaben ergänzt werden können.
- Cache-Busting auf `19.09` erhöht.

## Phase 19.06 – integrierte Bedienungsanleitung im Tool

- Ribbon-Button **Hilfe** öffnet jetzt eine richtige Hilfeseite im Arbeitsbereich statt nur ein kurzes Popup.
- Kurzanleitung mit 4 Schritten ergänzt: Projekt, Teilstrecken, Formteile, Bericht.
- Hilfe enthält Eingabeübersicht, QS-Hinweise, Kurzbefehle und direkten Zugriff auf Projekt, Anlagenübersicht, Formteil-Assistent, Bericht und Demo.
- Produktseite verlinkt direkt auf die Anleitung über `app.html?help=1`.
- App erkennt den Hilfe-Startparameter und öffnet direkt die Hilfeseite.
- Cache-Version auf `19.06` erhöht.

## Phase 19.05 – Footer-Copyright auf der Produktseite

- Footer der Produktseite ergänzt: `© 2026 Emre Özgöller – Druckverlust Pro · Professional`.
- `index.html` und `produkt.html` bleiben synchron.
- Cache-Version auf `19.05` erhöht.

## Phase 19.04 – Produktseite Feinschliff und Abschluss-CTA

- Kompakter Nutzenstreifen auf der Hauptseite ergänzt.
- Kurzvorteile eingebaut: ohne Excel-Chaos, nachvollziehbar, berichtsfertig.
- Abschlussbereich mit Buttons **Tool starten** und **Demo-Projekt testen** ergänzt.
- `index.html` und `produkt.html` bleiben synchron.
- Cache-Version auf `19.04` erhöht.

## Phase 19.03 – Demo-Start von der Hauptseite

- Demo-Button auf der Produktseite startet jetzt direkt das Demo-Projekt über `app.html?demo=1`.
- App erkennt den Demo-Startparameter automatisch und lädt das Beispielprojekt ohne manuelles Klicken auf „Demo“.
- Wenn noch eine lokale Autosicherung vorhanden ist, wird vor dem Demo-Laden gefragt.
- Cache-Version auf `19.03` erhöht.

## 19.01 – Produktseite als Startseite / Tool unter app.html

## Phase 19.02 – kurze Bedienungsanleitung auf der Hauptseite

- Hauptseite um kompakten Bereich „So funktioniert’s“ ergänzt.
- Vier kurze Schritte eingebaut: Projekt, Teilstrecken, Formteile, Bericht.
- Button „Tool starten“ direkt unter der Kurzanleitung ergänzt.
- Produktseite bewusst schlank gehalten, keine ausführliche Anleitung auf der Landingpage.
- Cache-Version auf 19.02 erhöht.


- `index.html` ist jetzt die Produkt-/Landingpage.
- Das eigentliche Berechnungstool wurde nach `app.html` verschoben.
- Alle Start-/Tool-Links auf der Produktseite zeigen jetzt auf `app.html`.
- `produkt.html` bleibt als Alias/zweite Produktadresse bestehen und verweist ebenfalls korrekt auf das Tool.
- Cache-Busting auf `19.01` erhöht.

## 19.00 – Produktseite / Landingpage

- Separate Produktseite ergänzt.
- Landingpage-CSS und Produktnavigation aufgebaut.
- App blieb in 19.00 noch unter `index.html`.

## 18.35a – Ribbon-QS-Schaltflächen ausgeblendet

- Sichtbare Ribbon-Schaltflächen **Datei-QS**, **Deploy prüfen** und **RC prüfen** entfernt.
- Interne Diagnosemodule bleiben erhalten und können später wieder aktiviert werden.
- Statusbar und Hilfedialog bereinigt, damit keine ausgeblendeten QS-Schaltflächen mehr beworben werden.
- Deployment-QS erwartet den ausgeblendeten Button **Deploy prüfen** nicht mehr als sichtbaren Ribbon-Befehl.
- Cache-Busting auf `18.35a` erhöht.

# CHANGELOG

## 18.35 – Release Candidate / Schlussprüfung

- Neuer Ribbon-Button **RC prüfen** ergänzt.
- Neues Diagnostikmodul `ReleaseCandidateDiagnostics` ergänzt.
- Schlussprüfung kombiniert Projektcheck, Rechen-QS, Datei-QS, Berichtmodell, Demo-Projekt, Speicherbarkeit und Deployment-QS.
- Eigene RC-Detailseite mit Ampelstatus, Zähler, Prüfpunkten und kopierbarem RC-Protokoll ergänzt.
- Deployment-QS prüft nun auch das neue RC-QS-Modul.
- Cache-Busting auf `18.35` erhöht.

## 18.34 – Demo-Projekt und Vorführmodus

- Neuer Ribbon-Button `Demo` ergänzt.
- Vollständiges Beispielprojekt mit 5 Teilstrecken, mehreren Formteilen und Sonderbauteilen ergänzt.
- Demo-Projekt nutzt die normale Rechenlogik und eignet sich für Rechen-QS, Datei-QS, Deploy-QS und Berichtstest.
- Ungespeicherte Änderungen werden vor dem Laden des Demo-Projekts abgefragt.
- Cache-Busting auf `18.34` erhöht.


## 18.33 – Bedienführung und Oberfläche polieren

- Neue Bedienführung in Projekt- und Anlagenübersicht ergänzt: Projektangaben, Teilstrecken, Formteile, QS und Bericht werden als klare Arbeitskette angezeigt.
- Pflichtfelder in den Projektangaben werden optisch markiert: Projektnummer, Projektname, BKP-Nummer und Anlage.
- Neuer Ribbon-Button **Start** führt zurück zur Projekt-/Anlagenübersicht.
- Neues Tastaturkürzel **Alt + Home** führt ebenfalls zurück zur Startübersicht.
- Statusbar erkennt nun Rechen-QS und Datei-QS als eigene Auswahlbereiche.
- Hilfedialog um Start, Datei-QS und Bedienhinweise erweitert.
- Cache-Busting auf `18.33` erhöht.

## 18.32 – Projektdatei-QS und .dvp-Stabilisierung

- `StorageEngine` erweitert: `.dvp`-Dateien enthalten jetzt Schema-Version, App-Version, Exportzeitpunkt und Projektzusammenfassung.
- Robustes Öffnen ergänzt: gültige `.dvp`-Dateien und ältere Rohprojekt-JSON-Strukturen werden erkannt und normalisiert.
- Projekt-Normalisierung ergänzt für Metadaten, Berichtsdaten, Anlagen, Teilstrecken, Formteile, Sonderbauteile, eindeutige IDs und Zuordnungen.
- Neuer Ribbon-Button **Datei-QS** mit Detailseite, Status, Dateiname, Schema, Grösse und kopierbarer QS-Zusammenfassung.
- Kompakter Datei-QS-Block in Projekt- und Anlagenübersicht ergänzt.
- Öffnen-Fehler und Import-Hinweise sind verständlicher.
- Cache-Busting auf `18.32` erhöht.

## 18.31 – Rechen-QS und fachlicher Nachweis

- Neuer Ribbon-Button **Rechen-QS** ergänzt.
- Neues Diagnostikmodul `CalculationDiagnostics` prüft Summenbildung, Rundung, Einzelresultate, Formteil-/Sonderbauteilanteile, p_dyn, Geschwindigkeit und Reibungsverlust.
- Anlagenübersicht erhält einen kompakten Rechen-QS-Block mit Fehlern, Hinweisen, OK-Punkten und Druckverlust-Aufteilung.
- Detailseite für Rechen-QS ergänzt inklusive kopierbarer QS-Zusammenfassung.
- Plausibilitätsprüfung weist negative Direktverluste, 0-Pa-Auffälligkeiten und Ergebnisanzahl-Abweichungen sauber aus.
- Cache-Busting auf `18.31` erhöht.

## 18.29 – Formteilbibliothek & Auswahl-Assistent

- Formteil-Auswahl um einen Assistenten mit Schnellfiltern ergänzt: alle Formteile, passend zur aktiven Teilstrecke, mit α/β-Auswahl und mit Grössen-/Anschluss-Sync.
- Bibliotheks-QS ergänzt: Anzahl Formteile, Kategorien, hinterlegte Bilder, gesperrte Winkel-Auswahl, Auto-Sync und Anschluss-Sync werden direkt angezeigt.
- Formteil-Karten verbessert: Beschreibung, Bildstatus, Auto-Sync, Anschluss-Sync, α/β-Dropdown und Kompatibilität zur aktiven Teilstrecke werden sichtbar.
- Kategorien fachlicher sortiert und verständlicher beschriftet: Rund/Rohr, Rechteck/Kanal, Übergänge, Abzweige/T-Stücke und Spezialformteile.
- Freie α-/β-Eingaben bleiben gesperrt; verfügbare Winkelwerte werden weiterhin über Dropdowns geführt.
- Cache-Busting auf `18.29` erhöht.

## 18.27 – Teilstrecken-Schnellerfassung
- Neue kompakte Schnellerfassung in der Anlagenübersicht ergänzt.
- Teilstrecken können direkt in der Übersicht mit Typ, Luftmenge, Länge und Geometrie bearbeitet werden.
- Zugeordnete Formteile werden bei Änderungen automatisch synchronisiert, sofern sie nicht manuell überschrieben wurden.
- Ergebniswerte v und Δp TS werden direkt in der Schnelltabelle angezeigt.
- Cache-Busting auf `18.27` erhöht.

## 18.26 – Ergebnisdetails verdichten

- Anlagenübersicht um verdichtete Teilstrecken-/Formteilaufteilung ergänzt.
- Kritische Teilstrecke mit höchstem Druckverlust wird automatisch hervorgehoben.
- Teilstrecken-Editor zeigt Kanal/Rohr, Formteile und Summe TS als kompakte Ergebnis-Karten.
- Formteil-Editor zeigt dynamischen Druck, ζ-/Direktmodus und Δp Formteil als kompakte Ergebnis-Karten.
- Zugeordnete Formteile zeigen neu p_dyn und die Kurzformel `ζ × p_dyn`.
- Cache-Busting auf `18.26` erhöht.


## 18.25 – Druckverlust-Aufteilung und PDF-Nachweis

- Gesamtzusammenfassung im Bericht um eine klare Druckverlust-Aufteilung ergänzt.
- Formel sichtbar gemacht: Kanal/Rohr + Formteile + Sonderbauteile = Gesamtdruckverlust.
- Teilstrecken-Aufteilung ergänzt mit `Δp Kanal/Rohr`, `Formteile` und `Summe TS`.
- Hinweis ergänzt, dass die Haupttabelle nur den Reibungsdruckverlust der Teilstrecke zeigt.
- Rundungsdifferenzen werden im Bericht transparent ausgewiesen.
- Legacy-PDF-Modul korrigiert: `Δp Kanal/Rohr Pa` statt unscharfem `ΔP Pa`; Wert entspricht nur dem Reibungsverlust.
- Cache-Busting auf `18.25` erhöht.

# Changelog

## 2.6.2 – Phase 51.20 – 21.07.2026

- Anlagenweite Auswahl der Raumnutzung nach SIA 2024:2021 Tabelle 13 und der Betriebsart 1-stufig, 2-stufig oder stufenlos ergänzt.
- Jährliche Elektro-Vollaststunden werden aus der gewählten Kombination automatisch ermittelt.
- Maximale Geschwindigkeitsrichtwerte für Rundrohre nach SIA 382/1:2025 Tabelle 49 je Teilstrecke berechnet.
- Zwischenwerte der Elektro-Vollaststunden zwischen 2’000, 4’000 und 8’000 h/a werden linear interpoliert.
- Rechteckkanäle werden mit dem Reduktionsfaktor aus Tabelle 50 bewertet; Zwischenwerte der Seitenverhältnisse werden interpoliert.
- Seitenverhältnisse ab 1:6 erhalten einen Normhinweis; Werte über 1:10 werden kontrolliert am Tabellenrand 1:10 begrenzt.
- Neue Anlagenübersicht mit Istwert, Rundrohr-Richtwert, Reduktionsfaktor, maximaler Geschwindigkeit und Status aller Teilstrecken.
- Kompakte Einzelprüfung im Teilstreckeneditor sowie Integration in Validierung, Qualitätsübersicht, Speicherung und Professional Report.
- Kritischer-Strang- und Schallhinweis aus dem bereitgestellten Normauszug sichtbar dokumentiert.
- 252 zusätzliche Phase-51.20-Prüfungen für Raumdaten, Tabellenlogik, Interpolation, Speicherung, Bericht und UI ergänzt.

## 18.24 – PDF-/Berichts-QS und Export-Feinschliff

- Exportprüfung im Bericht erweitert: Dokumenttitel, geplanter PDF-Seitenumfang und aktive Inhaltsbereiche werden sichtbar angezeigt.
- Dateivorschau zeigt nun HTML-Bericht, PDF-/Druckname und CSV-Datenexport separat.
- Neuer Button „Export-QS kopieren“ ergänzt, damit Prüfstatus und Hinweise schnell weitergegeben werden können.
- Zusätzliche Plausibilitätsprüfungen für sichtbaren Berechnungsinhalt, 0-Pa-Einträge, Formteil-Zuordnung, ausgeblendete leere Einträge und Seitenplan ergänzt.
- Cache-Busting auf `18.24` erhöht.

## 18.23 – Formteil-Anschluss-Sync für zweite Teilstrecken

- Formteile können zusätzliche Anschluss-Teilstrecken verwenden: Übergänge für die zweite Anschlussseite, Abzweige/Hosenstücke/T-Stücke für Abzweig AA/WA und Durchgang AD/WD.
- Neue Anschluss-Synchronisation im Formteil-Editor ergänzt.
- Beim Anwählen einer zusätzlichen Teilstrecke werden Grösse und Luftmenge automatisch auf die passenden Formteilfelder übernommen.
- Manuelle Anpassungen bleiben möglich; über „Anschlüsse übernehmen“ können die gewählten Anschlussseiten bewusst neu synchronisiert werden.
- Cache-Busting auf `18.23` erhöht.

## 18.22 – Teilstrecken-Eingabe-QS und Formteil-Sync

- Teilstrecken-Editor zeigt neu einen kompakten Eingabe-QS-Block für Luftmenge, Länge, Geometrie und Formteil-Synchronisation.
- Zugeordnete Formteile werden beim Ändern einer Teilstrecke automatisch mit der aktuellen Kanal-/Rohrgrösse synchronisiert, sofern sie nicht bewusst manuell überschrieben wurden.
- Im Bereich „Zugeordnete Formteile“ gibt es neu den Button „Grössen synchronisieren“, um auch manuell pausierte Formteile bewusst neu aus der Teilstrecke zu übernehmen.
- Formteil-Sync unterscheidet zwischen aktuell, offen, manuell und nicht zugeordnet.
- Cache-Busting auf `18.22` erhöht.

## 18.21 – Live-/UI-QS und Deployment-Prüfung erweitert

- Deployment-QS prüft jetzt zusätzlich die sichtbare Oberfläche: Shell, Ribbon, Sidebar, Arbeitsbereich und Statusbar.
- Eigenschaftenfenster wird kontrolliert, damit es weiterhin ausgeblendet bleibt.
- Ribbon-Befehle werden auf Vollständigkeit geprüft.
- UI-Überlauf / horizontale Seitenbreite wird erkannt und als Hinweis gemeldet.
- Bildschutzprüfung wurde erweitert: Logo-Ladevorgang und `draggable="false"` für Bilder.
- Pflichtdateien der Oberfläche und Versionszentrale in die Deploy-Prüfung aufgenommen.
- Ribbon wurde für kleinere Fenster stabilisiert; Befehle können horizontal scrollen, statt das Layout zu sprengen.
- Cache-Busting auf `18.21` erhöht.

## 18.20a – PDF-Δp-Spalte korrigiert

- PDF-Haupttabelle zeigt bei Kanälen/Rohren nun eindeutig den Reibungsdruckverlust der Teilstrecke.
- Formteilverluste werden nicht mehr in der Haupttabelle vermischt, sondern weiterhin separat im Formteilbereich ausgewiesen.
- Leere/undefinierte Direktverluste werden im Bericht als 0 behandelt, damit Rohr-Teilstrecken nicht mehr mit `-` erscheinen.
- Spaltenkopf und Legende im Bericht präzisiert.
- Cache-Busting auf `18.20a` erhöht.

## 18.20 – Automatische Formteil-Grössenübernahme

- Formteile übernehmen beim Erstellen bzw. beim Wechsel der zugeordneten Teilstrecke automatisch passende Grössen aus der Teilstrecke.
- Rechteck-Teilstrecken werden von m auf mm übernommen und auf Formteilfelder wie a/b, A/A1/A2/AD übertragen.
- Rundrohr-Teilstrecken werden auf d bzw. A_d/A1_d/A2_d/AD_d übertragen.
- Hauptluftmenge W und bei Durchgangsvarianten WD werden aus der Teilstrecken-Luftmenge übernommen.
- Manuelle Anpassungen bleiben möglich; über „Grössen übernehmen“ kann die aktuelle Teilstrecke jederzeit erneut übertragen werden.
- Cache-Busting auf `18.20` erhöht.

## 18.19 – Struktur-Cleanup und Altlastenbereinigung

- Projekt-ZIP ohne `.git`-Ordner bereitgestellt.
- Alte Übergabelisten und einfache Vorgänger-Oberfläche entfernt.
- Nicht mehr aktive Legacy-/Doppelmodule aus `src/` entfernt.
- Alte Referenz-Testseiten/-Skripte entfernt; aktuelle JSON-Testdaten bleiben erhalten.
- Cache-Busting auf `18.19` erhöht.
- PDF-Kompatibilitätsmodul auf die zentrale Versionsdatei umgestellt.
- Dokumentation `SPRINT18_19_STRUKTUR_CLEANUP.md`, Löschliste und optionales PowerShell-Cleanup-Script ergänzt.

## 18.18 – Versionszentrale und Update-QS

- Zentrale Versionsdatei `src/core/appVersion.js` ergänzt.
- Cache-Busting auf `18.18` erhöht.
- Statusbar, Hilfe, Info-Dialog und Deployment-QS verwenden jetzt dieselbe Versionsquelle.
- Neuer Ribbon-Button `Info` zeigt Version, Cache-Version, aktuelle Adresse und Projektumfang.
- `window.DruckverlustPro` enthält neu `version`, `label` und `info` für schnelle Browser-Konsole-Prüfung.
- Bericht-HTML nutzt die aktuelle Phase im Generator-Hinweis.

## 18.17 – Deployment-QS und finale Startdiagnose

- Neuer Ribbon-Button `Deploy prüfen` ergänzt.
- Neue Deployment-QS prüft GitHub-Pages-Pfad, Cache-Versionen, Pflichtmodule, Pflichtbilder und Startberechnung.
- Visuelle Deployment-QS-Seite mit OK-/Hinweis-/Fehlerzählung ergänzt.
- Zusammenfassung kann kopiert werden, damit Fehler beim Deployment einfacher weitergegeben werden können.
- Cache-Busting auf `18.17` erhöht: `index.html`, `src/main.js`, `WorkspaceComponent`, `ReportEngine` und PDF-Kompatibilitätsmodul.
- Statusbar zeigt Phase 18.17 an.


## 18.16 – Projektcheck / Abgabecheck

- Zentralen Diagnose-Service `ProjectDiagnostics` ergänzt.
- Projekt- und Anlagenübersicht zeigen jetzt einen Abgabe- und Plausibilitätscheck.
- Ribbon um `Projekt prüfen` erweitert.
- Prüfung umfasst Projektangaben, Teilstrecken, Formteile, Sonderbauteile, Berechnung, Berichtsdaten und Speicherbarkeit.
- Schnellaktionen im Check ergänzt: neu prüfen, Projektangaben öffnen und Bericht öffnen.
- Cache-Busting auf `18.16` erhöht.


## 18.15 – Autosicherung und Wiederherstellung

- Lokale Autosicherung im Browser ergänzt (`localStorage`).
- Ungespeicherte Änderungen werden automatisch gesichert.
- Beim erneuten Öffnen wird eine gefundene Autosicherung zur Wiederherstellung angeboten.
- Nach `Speichern`, `Neu` oder `Öffnen` wird die lokale Autosicherung sauber gelöscht.
- Warnhinweis beim Schliessen/Neuladen ergänzt, solange das Projekt ungespeicherte Änderungen enthält.
- Statusbar zeigt die letzte Autosicherung an.
- Cache-Busting auf `18.15` erhöht.

## 18.13 – Neu-Projekt und Bedienungs-QS

- Standardprojekt in `src/project/defaultProject.js` zentralisiert.
- App-Start und `Neu`-Button verwenden jetzt dieselbe Projektvorlage.
- `Neu` erstellt wieder automatisch 5 vorbereitete Teilstrecken.
- Vor `Neu` und `Öffnen` wird bei ungespeicherten Änderungen eine Sicherheitsabfrage angezeigt.
- Cache-Busting auf `18.13` erhöht.


## 18.12d – Logo im Ribbon und Eigenschaften ausgeblendet

- EO-Logo im oberen Ribbon direkt vor „Druckverlust Pro“ ergänzt.
- Eigenschaften-Seitenleiste in der Hauptoberfläche ausgeblendet, damit die Arbeitsfläche breiter und ruhiger wird.
- `PropertiesComponent` bleibt im Projekt erhalten und kann später wieder aktiviert werden, sobald die Detailbearbeitung dort genutzt wird.
- Cache-Busting auf `18.12d` erhöht.


## 18.12c – Bilderpfade und Bildschutz

- Report-Bilder werden auf GitHub Pages jetzt relativ zur Projektseite geladen, nicht mehr vom Domain-Root.
- Fehlerhafte 404-Aufrufe für `eo-logo.png`, `duct-network-hero.png` und Formteilbilder behoben.
- Cache-Busting auf `18.12c` erhöht.
- Bildschutz ergänzt: Drag, Rechtsklick und Markieren für Bilder/Skizzen werden blockiert.
- Für den Deploy-Fix werden die betroffenen Bilddateien zusätzlich in der Änderungs-ZIP mitgeliefert.

# CHANGELOG

## 18.35 – Release Candidate / Schlussprüfung

- Neuer Ribbon-Button **RC prüfen** ergänzt.
- Neues Diagnostikmodul `ReleaseCandidateDiagnostics` ergänzt.
- Schlussprüfung kombiniert Projektcheck, Rechen-QS, Datei-QS, Berichtmodell, Demo-Projekt, Speicherbarkeit und Deployment-QS.
- Eigene RC-Detailseite mit Ampelstatus, Zähler, Prüfpunkten und kopierbarem RC-Protokoll ergänzt.
- Deployment-QS prüft nun auch das neue RC-QS-Modul.
- Cache-Busting auf `18.35` erhöht.

## Phase 18.12b – Cache-/Deploy-Fix

- `index.html` lädt `ApplicationShell.css` und `src/main.js` neu mit Versionsparameter `?v=18.12b`.
- `src/pdf/report.js` verwendet keinen fehleranfälligen Named-Import von `calculateRow` mehr.
- Fallback-Berechnung im PDF-Modul ergänzt, damit alte Browser-/GitHub-Cache-Mischstände nicht mehr beim Start abbrechen.


## Phase 18.12a – Deploy-Fix

- Fehlenden Kompatibilitäts-Export in `src/calculation/engine.js` für GitHub-Pages-Deployment korrigiert.
- `calculateRow`, `fmt`, `calculateProject` und `createTest001State` werden wieder direkt bereitgestellt.
- Fehler behoben: `report.js` konnte `calculateRow` nicht importieren.

# Changelog

## 2.6.2 – Phase 51.20 – 21.07.2026

- Anlagenweite Auswahl der Raumnutzung nach SIA 2024:2021 Tabelle 13 und der Betriebsart 1-stufig, 2-stufig oder stufenlos ergänzt.
- Jährliche Elektro-Vollaststunden werden aus der gewählten Kombination automatisch ermittelt.
- Maximale Geschwindigkeitsrichtwerte für Rundrohre nach SIA 382/1:2025 Tabelle 49 je Teilstrecke berechnet.
- Zwischenwerte der Elektro-Vollaststunden zwischen 2’000, 4’000 und 8’000 h/a werden linear interpoliert.
- Rechteckkanäle werden mit dem Reduktionsfaktor aus Tabelle 50 bewertet; Zwischenwerte der Seitenverhältnisse werden interpoliert.
- Seitenverhältnisse ab 1:6 erhalten einen Normhinweis; Werte über 1:10 werden kontrolliert am Tabellenrand 1:10 begrenzt.
- Neue Anlagenübersicht mit Istwert, Rundrohr-Richtwert, Reduktionsfaktor, maximaler Geschwindigkeit und Status aller Teilstrecken.
- Kompakte Einzelprüfung im Teilstreckeneditor sowie Integration in Validierung, Qualitätsübersicht, Speicherung und Professional Report.
- Kritischer-Strang- und Schallhinweis aus dem bereitgestellten Normauszug sichtbar dokumentiert.
- 252 zusätzliche Phase-51.20-Prüfungen für Raumdaten, Tabellenlogik, Interpolation, Speicherung, Bericht und UI ergänzt.


## 18.12 – Professionelle Startseite aktiv

- Phase-18-Oberfläche als aktive Startseite angebunden.
- `index.html` auf professionelle Shell umgestellt.
- `src/main.js` als Bootstrap für ApplicationState, Shell, Ribbon, Sidebar, Workspace, Properties und Statusbar neu aufgebaut.
- Standardprojekt mit 5 Teilstrecken beim Start ergänzt.
- Initiale automatische Berechnung beim Start ergänzt.
- Ribbon um `+ Sonderbauteil` erweitert.
- Basis-CSS für randlose Vollbild-Shell ergänzt.


## Sprint 18.11 – Arbeitsdashboard / Schnellaktionen

### Neu
- Arbeitsdashboard in Projektansicht ergänzt.
- Arbeitsdashboard in Anlagenansicht ergänzt.
- Schnellaktionen für `+ Teilstrecke`, `+ Formteil`, `+ Sonderbauteil` und `Bericht öffnen` ergänzt.
- Nächste-Schritte-Hinweise abhängig vom Projektzustand ergänzt.
- QS-Status, Gesamtdruckverlust, relevante Teilstrecken und Berichtsumfang im Dashboard sichtbar.

### Tests
- `tests/sprint18-workflow-dashboard.html`
- `tests/sprint18-workflow-dashboard.test.js`

## 18.14 – Tastaturkürzel und Kontextaktionen

- Zentrale Tastaturbedienung ergänzt.
- `Ctrl+S`, `Ctrl+O`, `Ctrl+N`, `Ctrl+Enter`, `Ctrl+B`/`Ctrl+P`, `Ctrl+D`, `Entf`, `Esc` und `Ctrl+Alt+↑/↓` unterstützt.
- Ausgewählte Teilstrecken, Formteile und Sonderbauteile können per Tastatur dupliziert, gelöscht und verschoben werden.
- Ribbon um Hilfe-Button für die Tastaturkürzel ergänzt.
- Statusbar zeigt die wichtigsten Kurzbefehle an.
- Cache-Busting auf `18.14` erhöht.


## Phase 19.08 – Professional-/Trust-Bereich

- Produktseite um kompakten Bereich „Professional / Einsatz“ erweitert.
- Einsatzbereiche ergänzt: Planer, Kontrolle und Abgabe.
- Transparenzhinweis ergänzt: aktuelle Web-Version arbeitet ohne Cloud-Zwang und nutzt `.dvp`-Projektdateien.
- Footer um schnelle Links zu Tool, Anleitung und Demo ergänzt.
- Produktnavigation um „Einsatz“ erweitert.
- Cache-Busting auf `19.08` erhöht.

## Phase 19.07 – Bedienung, Demo und Beispielnachweis

- Produktseite um **Beispielbericht ansehen** ergänzt (`app.html?demo=1&report=1`).
- Kompakter Abschnitt **Demo / Beispielnachweis** ergänzt.
- Tool erkennt neu den Startparameter `report=1` bzw. `bericht=1` und öffnet direkt den Bericht.
- Hilfeseite im Tool erweitert: Beispielwerte, Demo-Erklärung, Rechenverständnis und PDF-Hinweise.
- Fehler in der Hilfe-Aktionsbindung bereinigt, sodass Projekt, Anlagenübersicht, Formteil-Assistent und Bericht zuverlässig geöffnet werden.
- Demo-Projekt mit klarerem Zweck und Berichtshinweis ergänzt.
- Cache-Busting auf `19.07` erhöht.

## Phase 40.10 – Produktstartseite aktualisiert

- `index.html` vollständig auf den Funktionsstand von Phase 40.00 gebracht.
- Neue Produktvorschau im Design der aktuellen Druckverlust-Pro-Oberfläche.
- Aktuelle Bereiche für Engineering-QS, Anlagenschema, Projektsteuerung, Professional Report und Projektsicherheit ergänzt.
- Veraltete Phase-21.12-, Lizenzmatrix- und Roadmap-Aussagen von der Startseite entfernt.
- Responsive Navigation, aktive Abschnittsmarkierung und mobile Menüführung ergänzt.
- Lokaler Start-Hinweis für `file://` weiterhin erhalten.
- Herstellerneutralität sowie Ausschluss von Ventilatorauslegung und Herstellerdatenbank sichtbar klargestellt.
