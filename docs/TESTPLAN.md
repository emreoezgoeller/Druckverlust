# Testplan

## Automatischer Lauf

```bash
npm test
```

Browseransichten:

- `tests/phase21-reference-tests.html`
- `tests/phase21-formpart-validation.html`
- `tests/phase21-practice-project.html`
- `tests/phase21-formpart-sync.html`
- `tests/phase21-comparison-matrix.html`
- `tests/phase21-feedback-round.html`
- `tests/phase21-release-decision.html`

Tool-Oberfläche:

- **Rechen-QS → Referenztests**
- **Rechen-QS → Formteil-QS**
- **Rechen-QS → Praxisprojekt-QS**
- **Rechen-QS → Formteil-Sync-QS**
- **Rechen-QS → Vergleichsmatrix**
- **Rechen-QS → Fachtest-Auswertung**
- **Rechen-QS → Freigabeentscheidung**

## Phase 21.00 – aktive Referenzfälle

### REF-001 – Rechteckkanal

Prüft Fläche, hydraulischen Durchmesser, Geschwindigkeit, dynamischen Druck, Reibungsgefälle, Reibungsverlust, ζ-Verlust und Rundung.

### REF-002 – Rundrohr

Prüft Kreisfläche, Geschwindigkeit, dynamischen Druck, Reibungsgefälle, Reibungsverlust, ζ-Verlust und Rundung.

### REF-003 – Summenbildung

Prüft:

- Reibung
- ζ-Formteilverlust
- direkten Formteilverlust
- Sonderbauteil
- Gesamtwert
- Rundung
- Summenaudit

### REF-004 – Rundung

Prüft die definierte Aufrundung auf den nächsten 0.5-Pa-Schritt.

### REF-005 – Eingaben

Prüft Dezimalkomma, leere/ungültige Werte und automatische Kanal-/Rohr-Erkennung.

### TEST-001 – Excel-Vergleich

900 m³/h, fünf Teilstrecken und Monoblock 100 Pa. Zielwert: 109.5 Pa ± 1.0 Pa.

## Phase 21.01 – Formteilbibliothek

Automatischer Lauf nur für die Formteilbibliothek:

```bash
npm run test:formparts
```

Geprüft werden:

- 14/14 registrierte Formteile
- eindeutige IDs, Kategorien und Berechnungsfunktionen
- Parameterdefinitionen und gesperrte Auswahlfelder
- Bild- und Excel-Pfade
- Manifest-Konsistenz
- 18 feste Excel-Referenzfälle
- 56 Tabellen-/Berechnungspunkte
- Excel-Suchregeln für Hosenstück, T-Abzweig rund 2 und 90° T-Stück Variante 2

Die Werte sind feste Regressionserwartungen aus den hinterlegten Excel-Arbeitsmappen. Eine externe Normenzertifizierung ist damit nicht verbunden.

## Phase 21.02 – Praxisprojekt und Berichtstest

Automatischer Lauf nur für das Praxisprojekt:

```bash
npm run test:practice
```

Geprüft werden:

- 48 Teilstrecken, davon Kanal- und Rohrabschnitte
- 36 zugeordnete Formteile
- 26 Sonderbauteile
- eindeutige IDs und gültige Zuordnungen
- Berechnung ohne Fehler
- positiver Gesamtdruckverlust
- vollständiges Berichtmodell
- Seitenumbruch bei mehr als 42 Teilstrecken
- zwei Hauptnetzseiten
- neun Formteilseiten
- zwei Sonderbauteilseiten
- insgesamt 20 geplante und gerenderte Seiten
- PDF-, HTML- und CSV-Dateinamen
- `.dvp`-Speicher-/Lese-Roundtrip ohne Verlust von Einträgen oder IDs

Sollstatus: 29/29 Prüfungen bestanden.

## Phase 21.03 – Formteil-Grössen- und Anschluss-Synchronisation

Automatischer Lauf nur für die Synchronisation:

```bash
npm run test:sync
```

Geprüft werden:

- 14/14 registrierte Formteile
- Hauptgrössen aus Kanal- und Rohr-Teilstrecken
- Umrechnung Teilstrecke in m → Formteil in mm
- Übergangsanschlüsse A1/A2
- Hauptanschluss A/W
- Durchgang AD/WD
- Abzweig AA/WA
- automatische Erkennung der Anschlussfelder aus der Formteildefinition
- keine wirkungslosen Anschlussauswahlen
- manuelle Overrides pausieren Auto-Sync
- erzwungene Synchronisation hebt den Override bewusst auf
- Änderungen an Anschluss-Teilstrecken werden automatisch nachgeführt
- separate Anschlusswerte bleiben beim Haupt-Sync erhalten

Sollstatus: 15/15 Testfälle und 113/113 Einzelprüfungen bestanden.
## Phase 21.04 – Fachliche Vergleichsmatrix und Handrechnungen

Automatischer Lauf nur für die Vergleichsmatrix:

```bash
npm run test:comparison
```

Geprüft werden zehn feste Handrechnungen:

- drei Rechteckkanäle
- drei Rundrohre
- eine abweichende Luftdichte
- zwei abweichende Reibungszahlen
- eine komplette Systemsumme mit ζ-Formteilen, direktem Formteilverlust und Sonderbauteil

Je Teilstrecke werden Fläche, hydraulischer Durchmesser, Geschwindigkeit, dynamischer Druck, Reibungsgefälle, Reibungsverlust, ζ-Verlust, ungerundeter Gesamtwert und 0,5-Pa-Aufrundung geprüft. Der Summenfall kontrolliert zusätzlich Komponenten-Audit und getrennte Rundung.

Sollstatus: 10/10 Fälle und 92/92 Einzelprüfungen bestanden.

Die Handwerte sind fest hinterlegt und werden nicht mit dem aktuellen Rechenkern erzeugt. Die Prüfung ist keine externe Normenzertifizierung.

## Phase 21.05 – Öffentliche Fachtest-Version

Automatischer Test des Protokollmodells:

```bash
npm run test:expert
```

Der öffentliche Fachtest ist direkt über `app.html?fachtest=1` oder im Tool unter **Rechen-QS → Fachtest-Protokoll** erreichbar.

Geprüft werden:

- 10 strukturierte manuelle Prüfpunkte
- Statuswerte Nicht geprüft / OK / Auffällig / Fehler
- Fortschritts- und Vollständigkeitsberechnung
- Tester-, Firmen- und Umgebungsangaben
- Gesamtbewertung und Freigabeempfehlung
- Blockierstatus bei manuellen Fehlern
- Text-, CSV- und Dateinamenausgabe
- lokales Zwischenspeichern im Browser
- automatischer Vorabcheck aus 5 Prüfserien mit insgesamt 329 Einzelprüfungen

Das Fachtester-Protokoll ist eine strukturierte Rückmeldung aus der Praxis. Es ersetzt keine externe Normenzertifizierung oder unabhängige technische Zulassung.


## Phase 21.07 – Fachtest-Runden-Auswertung

Automatischer Lauf:

```bash
npm run test:feedback-round
```

Geprüft werden Import, Normalisierung und Zusammenführung mehrerer Fachtester-Protokolle, Priorisierung von Fehlern/Hinweisen/offenen Punkten sowie die abgeleitete Freigabeempfehlung.

Sollstatus: 16/16 Einzelprüfungen bestanden.

## Phase 21.08 – Fachliche Freigabeentscheidung

Automatischer Lauf:

```bash
npm run test:release-decision
```

Geprüft werden:

- Übernahme der Fachtest-Rückmeldungen und Prioritäten
- automatische Einstufung kritisch / hoch / mittel
- bewusste formelle Freigabeentscheidung
- Erhalt bearbeiteter Massnahmen bei Aktualisierung der Fachtest-Runde
- Status-, Verantwortungs-, Termin- und Nachtestdaten
- Blockierung bei kritischen offenen Punkten oder fehlgeschlagenen Nachtests
- vollständige Freigabe nach Abschluss aller Massnahmen
- Text-, CSV- und JSON-Ausgabe
- JSON-Roundtrip und Ablehnung ungültiger Dateien

Sollstatus: 24/24 Einzelprüfungen bestanden.

## Phase 21.09 – Öffentlicher Beta-Freigabestand

Automatischer Lauf:

```bash
npm run test:beta-release
```

Geprüft werden:

- Schema, Zielversion und öffentliche Testadresse
- dokumentierter automatischer Teststand
- Übernahme realer Fachtest-Rückmeldungen
- Übernahme der formellen Freigabeentscheidung
- acht Pflichtpunkte der Beta-/Deployment-Checkliste
- Status **Vorbereitung**, **mit Auflagen**, **bereit** und **blockiert**
- Blockierung bei kritischer Freigabe oder fehlgeschlagenem Nachtest
- Text- und CSV-Ausgabe
- JSON-Roundtrip und Ablehnung ungültiger Dateien

Sollstatus: 27/27 Einzelprüfungen bestanden.

## Phase 21.10 – Beta-Feedback und Fehlererfassung

Automatischer Lauf:

```bash
npm run test:beta-feedback
```

Geprüft werden:

- Beta-Feedback-Dateityp und Schema
- Kategorien und Prioritäten
- Pflichtfelder und Blocker-Regel
- Status vollständig / mit Hinweisen / unvollständig
- Textausgabe mit Datenschutz-Hinweis
- JSON-Export und JSON-Roundtrip
- Rückfall auf Standardwerte bei ungültigen Optionen
- öffentliches Browser-Testformular

Sollstatus: 18/18 Einzelprüfungen bestanden.

## Phase 29.00 – Anlagenanalyse und PDF-Schema

```bash
npm run test:phase29
```

Geprüft werden Analysemodi, SVG-Ausgabe, mehrseitiges PDF-Anlagenschema, maximal fünf Teilstrecken je Schemaseite, Fortsetzungsangaben, Einlass/Auslass, Formteil-/Sonderbauteilzuordnung und lange Anlagen.

Das Praxisprojekt umfasst im aktuellen Professional Report 33 geplante und gerenderte Seiten.

## Phase 30.00 – Projektabschluss, Varianten und Revisionen

```bash
npm run test:phase30
```

Die drei Testgruppen prüfen insgesamt 57 Einzelpunkte:

- Speichern, Sortieren, Laden, Auswählen und Löschen von Simulationsvarianten,
- maximal zwölf Varianten und getrennte Berechnungsfingerprints,
- Erkennung veralteter Varianten,
- Revisionsvorschläge und automatische Revisionssnapshots,
- Revisionshistorie und Abschluss-Score,
- persistente `.dvp`-Roundtrips für Varianten, Auswahl und Snapshots,
- Ribbon- und Workspace-Integration,
- Berichtoption und Variantenvergleich,
- HTML- und CSV-Ausgabe,
- optionale Behandlung von Projekten ohne gespeicherte Varianten.

Die Phase-30-Prüfung ergänzt die vollständige Suite; sie ersetzt keine der bestehenden Rechen-, Formteil-, Praxis- oder Berichtstests.


## Phase 31.00 – Revisionsvergleich und Prüfprotokoll

```bash
npm run test:phase31
```

Die beiden Testgruppen prüfen insgesamt 48 Einzelpunkte:

- technische Detail-Snapshots für Teilstrecken, Formteile und Sonderbauteile,
- identische, hinzugefügte, entfernte und geänderte Elemente,
- Vorher-/Nachher-Werte und Druckverlustdifferenzen,
- auswählbare und persistente Vergleichsbasis,
- Revisionsvergleich-CSV, Filter und Workspace-Integration,
- manuelles Prüfprotokoll mit sechs Prüfpunkten,
- Einbindung in Abschluss-Score, Professional Report und Gesamt-CSV,
- `.dvp`-Roundtrip für Detail-Snapshots und Prüfprotokoll,
- Rückwärtskompatibilität zu älteren Snapshots ohne technische Detaildaten.

Die Phase-31-Prüfung ergänzt die vollständige Suite; sie ersetzt keine bestehenden Rechen-, Formteil-, Praxis-, Schema- oder Berichtstests.
