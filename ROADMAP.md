# Druckverlust Pro – Roadmap nach Version 3.0

Aktueller Entwicklungsstand: **Version 3.0.0 · Phase 58.00**. Der fachliche und technische Finalstand ist abgeschlossen. Die Anwendung enthält eine dokumentierte Windows-Druckabnahme für Chrome und Edge; offene Bestätigungen werden transparent angezeigt und nicht automatisch als bestanden markiert.

## Phase 50.00 – Intelligenter Formteil-Workflow – abgeschlossen

- Formteile aus aktueller Teilstrecke oder frei gewähltem Picker-Kontext erstellen,
- manuelle Geometrie- und Anschlusswerte beim Umordnen schützen,
- bestätigbare Anschlussvorschläge für Übergänge und Abzweige,
- lokale Formteilreihenfolge je Teilstrecke,
- klare Warnungen bei fehlenden und widersprüchlichen Zuordnungen.

## Phase 51.00 – Oberflächen- und Ribbon-Abschluss – abgeschlossen

- einzeilige Plattformleiste mit integriertem Logo und Status,
- sofortige Infotexte sowie Symbol- und Statuslegende,
- überlaufsichere Sidebar und Arbeitsfläche,
- responsive Werkzeugführung für Desktop, Tablet und Smartphone.

## Phase 51.10 – Sechs neue Krümmerformteile – abgeschlossen

- vier Krümmerabzweige für Abzweig/Durchgang und Verteilung/Zusammenfluss,
- zwei Krümmerendstücke für Rechteckkanäle,
- automatische Übernahme der Haupt-, Durchgangs- und Abzweig-Teilstrecken,
- Excel-getreue Geometrie- und Geschwindigkeitsverhältnis-Suche,
- kontrollierte negative ζ-Werte und klare Sperre bei nicht hinterlegten Geometrien,
- Formteilbibliothek auf 21 Typen erweitert.

## Phase 51.20 – SIA-Geschwindigkeitsprüfung – abgeschlossen

- Raumnutzung nach SIA 2024:2021 Tabelle 13 je Anlage auswählen,
- Betriebsart 1-stufig, 2-stufig oder stufenlos festlegen,
- Elektro-Vollaststunden automatisch ableiten,
- Rundrohr-Richtwert nach SIA 382/1:2025 Tabelle 49 interpolieren,
- Rechteckkanäle mit Reduktionsfaktor nach Tabelle 50 prüfen,
- Überschreitungen und nicht empfohlene Seitenverhältnisse in Anlage, Teilstrecke, QS und Bericht anzeigen.

## Phase 52.00 – Vereinfachte Ergebnisdarstellung – abgeschlossen

- Anlagen-Ergebnis direkt am Seitenanfang sichtbar,
- Reibungs-, Formteil-, Sonderbauteil- und Gesamtverlust klar getrennt,
- kritische Teilstrecke automatisch hervorgehoben,
- Standard- und Profi-Ansicht dauerhaft umschaltbar,
- technische Anlagen- und Teilstreckenwerte einklappbar,
- Glossar für Δp, λ, ζ, k und p_dyn ergänzt.

## Phase 53.00 – PDF- und Berichtsabschluss – abgeschlossen

- weisses Deckblatt mit Logo, grossem dezentem Symbol-Wasserzeichen und technischem Dokumentblock,
- dynamisches Inhaltsverzeichnis und durchgängige Seitennummerierung,
- drucksichere Seitenaufteilung für Teilstrecken, Formteile, Sonderbauteile, Engineering-QS, QS-Protokoll und Formteilkatalog,
- automatische vertikale und horizontale Layoutprüfung vor dem Browserdruck.

## Phase 54.00 – Anlagenschema im Bericht – abgeschlossen

- vereinheitlichte Vektorsymbole und dynamische Symbollegende,
- fortlaufende F-/S-Referenzen und Bauteil-Zuordnung je Teilstrecke,
- adaptive Aufteilung langer und bauteilreicher Anlagen auf mehrere Schemaabschnitte,
- Abschnittsfortschritt und lückenlose Fortsetzungskennzeichnung,
- getrennte Symbolbahnen mit kontrolliertem +n-Überlauf,
- automatische Prüfung auf Karten-, Symbol- und Randüberschneidungen.

## Phase 55.00 – Projektdateien und Rückwärtskompatibilität – abgeschlossen

- aktuelles Projektdateischema auf **1.3.0** angehoben,
- historische `.dvp`-Hüllen, rohe Projektobjekte und ältere deutsche Feldnamen kontrolliert übernommen,
- Originaldatei vor einer notwendigen Migration automatisch als `Original-vor-Migration` gesichert,
- fehlende Rauigkeit je Teilstrecke mit **0,15 mm** ergänzt,
- fehlende oder ungültige SIA-Angaben bewusst nicht erfunden und als „nicht konfiguriert“ gekennzeichnet,
- numerische und historische Teilstrecken-IDs normalisiert,
- gültige Haupt-, Durchgangs-, Abzweig- und Sonderbauteilzuordnungen erhalten,
- ungültige Zuordnungen kontrolliert gelöst und im Öffnungsprotokoll ausgewiesen,
- beschädigte, leere, fremde oder mit einer neueren Programmversion erstellte Dateien verständlich abgefangen,
- erneutes Speichern und Öffnen migrierter Projekte als verlustfreier Roundtrip abgesichert.

## Phase 56.00 – Büro- und Praxistest – abgeschlossen

- drei deterministische Praxisprojekte mit insgesamt 7 Anlagen und 230 Teilstrecken geprüft,
- gemischte Rechteck-/Rundnetze, unterschiedliche Rauigkeiten und vollständige SIA-Konfigurationen getestet,
- Grossstrang mit 108 Teilstrecken und mehr als 100 Formteilen belastet,
- 360 Formteile und 58 Sonderbauteile auf Zuordnung, Berechnung und Speicherung geprüft,
- unabhängige Handrechnung mit fixer Darcy-Reibungszahl gegen Reibungs-, ζ-, Sonderbauteil- und Gesamtsumme verglichen,
- Rauigkeitssensitivität für k = 0,09 mm und k = 0,30 mm nachgewiesen,
- verlustfreie `.dvp`-Roundtrips und 123 geplante Berichtseiten kontrolliert,
- 30-seitigen A4-Bericht erzeugt, gerendert und visuell auf Deckblatt, Haupttabelle und Abschlussseite geprüft,
- reproduzierbaren Chrome-/Edge-Headless-Test ergänzt; die manuelle Windows-Browserabnahme bleibt Teil des Release-Candidate-Checks.

## Phase 57.00 – Release Candidate und Fehlerbereinigung – abgeschlossen

- sichtbare RC-Prüfung im Ribbon ergänzt,
- alle Anlagen eines Projekts neu berechnet und mit Projekt-/Rechen-QS geprüft,
- Berichtmodell und Seitenplan je Anlage kontrolliert,
- echten `.dvp`-Speicher-/Öffnungs-/Neuberechnungs-Roundtrip ergänzt,
- deterministischen Büro-Praxis-Smoketest in den RC-Check integriert,
- konservative Laufzeitbudgets für Berechnung, Bericht und Datei ergänzt,
- SIA-Konfiguration aller Anlagen als RC-Kriterium aufgenommen,
- Modul- und App-Asset-Cachekennungen auf einen einheitlichen Stand bereinigt,
- Versionen, Dokumentation und vollständige Regressionstestkette vereinheitlicht,
- manuelle Windows-Chrome-/Edge-Druckabnahme als letzter Final-Gate dokumentiert.

## Phase 58.00 – Druckverlust Pro 3.0 Final – abgeschlossen

- Version, Cachekennung und Release-Metadaten auf **3.0.0 / 58.00** vereinheitlicht,
- bisherige RC-Prüfung zur Finalprüfung mit Integritäts-, Deployment- und Browserabnahme erweitert,
- SHA-256-Manifest für sämtliche Dateien des sauberen Laufzeitpakets ergänzt,
- manuelle Windows-Druckabnahme für Google Chrome und Microsoft Edge nachvollziehbar dokumentiert,
- sauberes Laufzeitpaket ohne Tests, GitHub-Vorlagen, interne Entwicklungsdokumente und temporäre Prüfdateien erstellt,
- Startseite, Berechnung, Bericht, Projektformate, Rechtstexte, Release Notes und Regressionstestkette final geprüft,
- weitere Arbeiten ab jetzt als Wartungs-, Fehlerkorrektur- oder klar getrennte Plattformphase führen.

## Spätere Plattformintegration

- gemeinsames Projektcenter mit Luftmengen, Schall, Hx und Kanalschieber,
- kontrollierter Datenaustausch zwischen den Tools,
- Windows-Installationspaket für die gesamte Plattform.

## Dauerhaft ausgeschlossen

- Ventilatorauslegung einschließlich Motorleistung, SFP, Energie und Betriebskosten,
- Hersteller-Bauteildatenbank oder Produkt-/Artikelnummernbindung.
