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

Tool-Oberfläche:

- **Rechen-QS → Referenztests**
- **Rechen-QS → Formteil-QS**
- **Rechen-QS → Praxisprojekt-QS**
- **Rechen-QS → Formteil-Sync-QS**
- **Rechen-QS → Vergleichsmatrix**

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

