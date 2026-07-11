# Phase 21.05 – Öffentliche Fachtest-Version

## Ziel

Druckverlust Pro soll kontrolliert an externe Lüftungsplaner und Fachpersonen zum Praxistest übergeben werden können. Dafür wurde ein einheitliches Fachtester-Protokoll direkt in das Tool integriert.

## Automatischer Vorabcheck

Vor dem manuellen Test werden fünf bestehende QS-Blöcke zusammengeführt:

1. Rechenkern / Referenztests
2. Formteilbibliothek / Excel-Referenzen
3. Formteil-Grössen- und Anschluss-Synchronisation
4. Handrechnungen / Vergleichsmatrix
5. Praxisprojekt / Bericht / `.dvp`

Aktueller Sollstand: **5/5 Prüfserien und 329/329 Einzelprüfungen bestanden**.

## Manueller Fachtest

Das Protokoll enthält zehn Praxisschritte:

- Projekt neu anlegen und Stammdaten erfassen
- Rechteckkanal erfassen
- Rundrohr erfassen
- Formteil auswählen und zuordnen
- Grössen- und Anschlussübernahme prüfen
- Sonderbauteil erfassen
- `.dvp` speichern und wieder öffnen
- Bericht und PDF prüfen
- Ergebnis unabhängig plausibilisieren
- Bedienung und Arbeitsablauf bewerten

Jeder Schritt kann als **Nicht geprüft**, **OK**, **Auffällig** oder **Fehler** bewertet und mit einer Bemerkung ergänzt werden.

## Datenschutz / Speicherung

Testerangaben und Bemerkungen werden ausschliesslich lokal im Browser gespeichert. Es gibt in dieser Phase keine automatische Serverübermittlung. Der Tester kann das Protokoll als TXT oder CSV herunterladen beziehungsweise als Text kopieren.

## Aufruf

- Direkt: `app.html?fachtest=1`
- Im Tool: **Rechen-QS → Fachtest-Protokoll**
- Browser-Test: `tests/phase21-expert-test-protocol.html`
- Node-Test: `npm run test:expert`

## Abgrenzung

Das Protokoll strukturiert Praxiserfahrungen und Freigabeempfehlungen. Es ist keine externe Normenzertifizierung und keine behördliche Zulassung.
