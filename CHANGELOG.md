# Änderungsverlauf

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
